/**
 * Integração com Moodle
 *
 * Suporta:
 * - Exportação de questões no formato GIFT
 * - Importação de questões do formato GIFT
 * - Configuração LTI para SSO
 */

interface QuestaoExport {
  enunciado: string;
  tipo: string;
  dificuldade: string;
  explicacao?: string | null;
  alternativas: Array<{
    texto: string;
    correta: boolean;
  }>;
}

interface QuestaoImport {
  enunciado: string;
  tipo: "MULTIPLA_ESCOLHA_UNICA" | "MULTIPLA_ESCOLHA_MULTIPLA";
  dificuldade: "FACIL" | "MEDIO" | "DIFICIL";
  explicacao?: string;
  alternativas: Array<{
    texto: string;
    correta: boolean;
    ordem: number;
  }>;
}

/**
 * Converte uma questão para o formato GIFT do Moodle
 * https://docs.moodle.org/en/GIFT_format
 */
export function questaoToGIFT(questao: QuestaoExport): string {
  const { enunciado, alternativas, explicacao, tipo } = questao;

  // Escapar caracteres especiais do GIFT
  const escapeGIFT = (text: string): string => {
    return text
      .replace(/~/g, "\\~")
      .replace(/=/g, "\\=")
      .replace(/#/g, "\\#")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/:/g, "\\:");
  };

  let gift = "";

  // Título (comentário)
  gift += `// Questão exportada do Simulab\n`;

  // Enunciado
  gift += `${escapeGIFT(enunciado)} {\n`;

  // Alternativas
  if (tipo === "MULTIPLA_ESCOLHA_UNICA") {
    alternativas.forEach((alt) => {
      const prefix = alt.correta ? "=" : "~";
      gift += `  ${prefix}${escapeGIFT(alt.texto)}\n`;
    });
  } else if (tipo === "MULTIPLA_ESCOLHA_MULTIPLA") {
    // Para múltipla escolha múltipla, usamos pesos
    const corretas = alternativas.filter((a) => a.correta).length;
    const incorretas = alternativas.filter((a) => !a.correta).length;
    const pesoCorreto = corretas > 0 ? Math.floor(100 / corretas) : 0;
    const pesoIncorreto = incorretas > 0 ? -Math.floor(100 / incorretas) : 0;

    alternativas.forEach((alt) => {
      if (alt.correta) {
        gift += `  ~%${pesoCorreto}%${escapeGIFT(alt.texto)}\n`;
      } else {
        gift += `  ~%${pesoIncorreto}%${escapeGIFT(alt.texto)}\n`;
      }
    });
  }

  // Feedback/Explicação
  if (explicacao) {
    gift += `  ####${escapeGIFT(explicacao)}\n`;
  }

  gift += `}\n\n`;

  return gift;
}

/**
 * Converte múltiplas questões para formato GIFT
 */
export function questoesToGIFT(questoes: QuestaoExport[]): string {
  let gift = `// Arquivo GIFT exportado do Simulab\n`;
  gift += `// Data: ${new Date().toISOString()}\n`;
  gift += `// Total de questões: ${questoes.length}\n\n`;

  questoes.forEach((q, index) => {
    gift += `// Questão ${index + 1}\n`;
    gift += questaoToGIFT(q);
  });

  return gift;
}

/**
 * Parseia o formato GIFT para questões
 * Suporta questões de múltipla escolha simples
 */
export function parseGIFT(giftText: string): QuestaoImport[] {
  const questoes: QuestaoImport[] = [];

  // Remover comentários
  const lines = giftText
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");

  // Regex para capturar questões
  const questionRegex = /([^{]+)\s*\{([^}]+)\}/g;
  let match;

  while ((match = questionRegex.exec(lines)) !== null) {
    const enunciado = match[1]
      .trim()
      .replace(/\\~/g, "~")
      .replace(/\\=/g, "=")
      .replace(/\\#/g, "#")
      .replace(/\\\{/g, "{")
      .replace(/\\\}/g, "}")
      .replace(/\\:/g, ":");

    const alternativasText = match[2].trim();
    const alternativas: QuestaoImport["alternativas"] = [];
    let explicacao: string | undefined;
    let temMultiplaCorreta = false;

    // Parsear alternativas
    const altLines = alternativasText.split("\n");
    let ordem = 0;

    for (const line of altLines) {
      const trimmedLine = line.trim();

      // Verificar feedback/explicação
      if (trimmedLine.startsWith("####")) {
        explicacao = trimmedLine
          .substring(4)
          .replace(/\\~/g, "~")
          .replace(/\\=/g, "=")
          .replace(/\\#/g, "#")
          .replace(/\\\{/g, "{")
          .replace(/\\\}/g, "}")
          .replace(/\\:/g, ":");
        continue;
      }

      // Alternativa correta simples
      if (trimmedLine.startsWith("=")) {
        alternativas.push({
          texto: trimmedLine.substring(1).trim(),
          correta: true,
          ordem: ordem++,
        });
        continue;
      }

      // Alternativa incorreta ou com peso
      if (trimmedLine.startsWith("~")) {
        // Verificar se tem peso
        const pesoMatch = trimmedLine.match(/^~%(-?\d+)%(.+)$/);
        if (pesoMatch) {
          const peso = parseInt(pesoMatch[1]);
          const texto = pesoMatch[2].trim();
          const correta = peso > 0;
          if (correta) temMultiplaCorreta = true;
          alternativas.push({
            texto,
            correta,
            ordem: ordem++,
          });
        } else {
          alternativas.push({
            texto: trimmedLine.substring(1).trim(),
            correta: false,
            ordem: ordem++,
          });
        }
      }
    }

    if (alternativas.length >= 2) {
      const corretas = alternativas.filter((a) => a.correta).length;

      questoes.push({
        enunciado,
        tipo: corretas > 1 || temMultiplaCorreta
          ? "MULTIPLA_ESCOLHA_MULTIPLA"
          : "MULTIPLA_ESCOLHA_UNICA",
        dificuldade: "MEDIO", // Padrão
        explicacao,
        alternativas,
      });
    }
  }

  return questoes;
}

/**
 * Configuração LTI 1.3 para Moodle
 */
export interface LTIConfig {
  clientId: string;
  deploymentId: string;
  platformUrl: string;
  publicKey: string;
  privateKey: string;
  authEndpoint: string;
  tokenEndpoint: string;
  jwksEndpoint: string;
}

/**
 * Gera a configuração JSON para registrar no Moodle
 */
export function generateMoodleToolConfig(baseUrl: string): object {
  return {
    title: "Simulab",
    description: "Plataforma de simulados e avaliações",
    oidc_initiation_url: `${baseUrl}/api/lti/login`,
    target_link_uri: `${baseUrl}/api/lti/launch`,
    public_jwk_url: `${baseUrl}/api/lti/jwks`,
    custom_parameters: {},
    scopes: [
      "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
      "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly",
      "https://purl.imsglobal.org/spec/lti-ags/scope/score",
      "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly",
    ],
    extensions: [
      {
        platform: "moodle.org",
        settings: {
          placements: [
            {
              placement: "course_navigation",
              message_type: "LtiResourceLinkRequest",
            },
            {
              placement: "link_selection",
              message_type: "LtiDeepLinkingRequest",
            },
          ],
        },
      },
    ],
  };
}
