import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  // Criar workbook
  const workbook = XLSX.utils.book_new();

  // Aba de Instruções
  const instrucoesData = [
    ["INSTRUÇÕES DE PREENCHIMENTO - SimulaB"],
    [""],
    ["Este template permite importar questões de múltipla escolha."],
    [""],
    ["CAMPOS OBRIGATÓRIOS:"],
    ["- tipo: MULTIPLA_ESCOLHA_UNICA ou MULTIPLA_ESCOLHA_MULTIPLA"],
    ["- enunciado: Texto da pergunta"],
    ["- dificuldade: FACIL, MEDIO ou DIFICIL"],
    ["- alt_a até alt_e: Texto das alternativas (mínimo 2)"],
    ["- corretas: Letras das alternativas corretas (ex: A ou A,B,C)"],
    [""],
    ["CAMPOS OPCIONAIS:"],
    ["- tags: Palavras-chave separadas por vírgula"],
    ["- explicacao: Explicação da resposta correta"],
    [""],
    ["DICAS:"],
    ["- Para MULTIPLA_ESCOLHA_UNICA, informe apenas uma letra em 'corretas'"],
    ["- Para MULTIPLA_ESCOLHA_MULTIPLA, separe as letras por vírgula (ex: A,B)"],
    ["- Deixe alt_d e alt_e vazias se tiver menos de 5 alternativas"],
    [""],
    ["Veja a aba 'Exemplos' para referência e preencha na aba 'Questões'."],
  ];
  const wsInstrucoes = XLSX.utils.aoa_to_sheet(instrucoesData);
  wsInstrucoes["!cols"] = [{ width: 80 }];
  XLSX.utils.book_append_sheet(workbook, wsInstrucoes, "Instruções");

  // Aba de Questões (para preencher)
  const questoesHeaders = [
    ["tipo", "enunciado", "dificuldade", "tags", "explicacao", "alt_a", "alt_b", "alt_c", "alt_d", "alt_e", "corretas"],
  ];
  const wsQuestoes = XLSX.utils.aoa_to_sheet(questoesHeaders);
  wsQuestoes["!cols"] = [
    { width: 25 },  // tipo
    { width: 60 },  // enunciado
    { width: 12 },  // dificuldade
    { width: 25 },  // tags
    { width: 50 },  // explicacao
    { width: 30 },  // alt_a
    { width: 30 },  // alt_b
    { width: 30 },  // alt_c
    { width: 30 },  // alt_d
    { width: 30 },  // alt_e
    { width: 10 },  // corretas
  ];
  XLSX.utils.book_append_sheet(workbook, wsQuestoes, "Questões");

  // Aba de Exemplos
  const exemplosData = [
    ["tipo", "enunciado", "dificuldade", "tags", "explicacao", "alt_a", "alt_b", "alt_c", "alt_d", "alt_e", "corretas"],
    [
      "MULTIPLA_ESCOLHA_UNICA",
      "Qual porta padrão o protocolo HTTP utiliza?",
      "FACIL",
      "http,redes,portas",
      "O HTTP utiliza a porta 80 como padrão para comunicação não criptografada",
      "80",
      "443",
      "22",
      "21",
      "",
      "A",
    ],
    [
      "MULTIPLA_ESCOLHA_MULTIPLA",
      "Quais dos seguintes são protocolos da camada de transporte do modelo OSI?",
      "MEDIO",
      "osi,tcp,udp,transporte",
      "TCP e UDP são os dois principais protocolos da camada 4 (Transporte)",
      "TCP",
      "UDP",
      "IP",
      "HTTP",
      "ICMP",
      "A,B",
    ],
    [
      "MULTIPLA_ESCOLHA_UNICA",
      "O que significa a sigla DNS?",
      "FACIL",
      "dns,redes,nomenclatura",
      "DNS = Domain Name System, responsável por traduzir nomes de domínio em endereços IP",
      "Domain Name System",
      "Dynamic Network Service",
      "Digital Network Standard",
      "Data Name Server",
      "",
      "A",
    ],
    [
      "MULTIPLA_ESCOLHA_MULTIPLA",
      "Selecione os comandos válidos do Linux para listar arquivos:",
      "MEDIO",
      "linux,comandos,arquivos",
      "Os comandos ls, dir e ll são usados para listar arquivos em sistemas Linux",
      "ls",
      "dir",
      "ll",
      "list",
      "show",
      "A,B,C",
    ],
    [
      "MULTIPLA_ESCOLHA_UNICA",
      "Qual camada do modelo OSI é responsável pelo roteamento?",
      "MEDIO",
      "osi,roteamento,rede",
      "A camada 3 (Rede) é responsável pelo roteamento de pacotes entre redes",
      "Camada de Rede",
      "Camada de Transporte",
      "Camada de Enlace",
      "Camada Física",
      "",
      "A",
    ],
  ];
  const wsExemplos = XLSX.utils.aoa_to_sheet(exemplosData);
  wsExemplos["!cols"] = [
    { width: 25 },
    { width: 60 },
    { width: 12 },
    { width: 25 },
    { width: 50 },
    { width: 30 },
    { width: 30 },
    { width: 30 },
    { width: 30 },
    { width: 30 },
    { width: 10 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsExemplos, "Exemplos");

  // Gerar buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=template_questoes_simulab.xlsx",
    },
  });
}
