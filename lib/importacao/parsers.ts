import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { QuestaoImport } from "@/lib/validations/importacao";

interface ParseResult {
  questoes: Partial<QuestaoImport>[];
  errors: string[];
}

// Mapeamento de letras para índices
const letraParaIndice: Record<string, number> = {
  A: 0, B: 1, C: 2, D: 3, E: 4, F: 5,
  a: 0, b: 1, c: 2, d: 3, e: 4, f: 5,
};

// Parser de CSV
export function parseCSV(content: string): ParseResult {
  const result: ParseResult = { questoes: [], errors: [] };

  try {
    // Remover linhas de comentário (começam com #)
    const linhas = content.split("\n").filter((l) => !l.trim().startsWith("#") && l.trim());
    const csvLimpo = linhas.join("\n");

    const parsed = Papa.parse<Record<string, string>>(csvLimpo, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    if (parsed.errors.length > 0) {
      result.errors = parsed.errors.map((e) => `Linha ${e.row}: ${e.message}`);
    }

    parsed.data.forEach((row, index) => {
      try {
        const questao = csvRowToQuestao(row, index);
        result.questoes.push(questao);
      } catch (error) {
        result.errors.push(`Linha ${index + 2}: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      }
    });
  } catch (error) {
    result.errors.push(`Erro ao processar CSV: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }

  return result;
}

// Converter linha CSV para questão
function csvRowToQuestao(row: Record<string, string>, _index: number): Partial<QuestaoImport> {
  const tipo = row.tipo?.trim().toUpperCase();
  const enunciado = row.enunciado?.trim();
  const dificuldade = row.dificuldade?.trim().toUpperCase();
  const tags = row.tags ? row.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const explicacao = row.explicacao?.trim();
  const corretas = row.corretas?.trim().toUpperCase().split(",").map((c) => c.trim());

  // Coletar alternativas
  const alternativas: { texto: string; correta: boolean }[] = [];
  const altKeys = ["alt_a", "alt_b", "alt_c", "alt_d", "alt_e", "alt_f"];

  altKeys.forEach((key, idx) => {
    const texto = row[key]?.trim();
    if (texto) {
      const letra = String.fromCharCode(65 + idx); // A, B, C...
      alternativas.push({
        texto,
        correta: corretas?.includes(letra) || false,
      });
    }
  });

  if (tipo === "MULTIPLA_ESCOLHA_UNICA" || tipo === "MULTIPLA_ESCOLHA_MULTIPLA") {
    return {
      tipo: tipo as "MULTIPLA_ESCOLHA_UNICA" | "MULTIPLA_ESCOLHA_MULTIPLA",
      enunciado,
      dificuldade: dificuldade as "FACIL" | "MEDIO" | "DIFICIL",
      tags,
      explicacao,
      alternativas,
    };
  }

  // Para outros tipos, retornar estrutura básica
  return {
    tipo: tipo as QuestaoImport["tipo"],
    enunciado,
    dificuldade: dificuldade as "FACIL" | "MEDIO" | "DIFICIL",
    tags,
    explicacao,
  };
}

// Parser de Excel
export function parseExcel(buffer: ArrayBuffer): ParseResult {
  const result: ParseResult = { questoes: [], errors: [] };

  try {
    const workbook = XLSX.read(buffer, { type: "array" });

    // Procurar aba "Questões" ou usar a primeira aba que não seja "Instruções" ou "Exemplos"
    let sheetName = workbook.SheetNames.find((name) =>
      name.toLowerCase() === "questões" || name.toLowerCase() === "questoes"
    );

    if (!sheetName) {
      sheetName = workbook.SheetNames.find((name) =>
        !["instruções", "instrucoes", "exemplos"].includes(name.toLowerCase())
      );
    }

    if (!sheetName) {
      sheetName = workbook.SheetNames[0];
    }

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      raw: false,
      defval: "",
    });

    data.forEach((row, index) => {
      try {
        // Normalizar chaves para lowercase
        const normalizedRow: Record<string, string> = {};
        Object.keys(row).forEach((key) => {
          normalizedRow[key.toLowerCase().trim()] = String(row[key] || "").trim();
        });

        const questao = csvRowToQuestao(normalizedRow, index);
        result.questoes.push(questao);
      } catch (error) {
        result.errors.push(`Linha ${index + 2}: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      }
    });
  } catch (error) {
    result.errors.push(`Erro ao processar Excel: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }

  return result;
}

// Parser de JSON
export function parseJSON(content: string): ParseResult {
  const result: ParseResult = { questoes: [], errors: [] };

  try {
    const data = JSON.parse(content);

    // Remover campo de comentários se existir
    if (data._comentarios) {
      delete data._comentarios;
    }

    // Verificar estrutura
    if (Array.isArray(data)) {
      // Array direto de questões
      result.questoes = data;
    } else if (data.questoes && Array.isArray(data.questoes)) {
      // Objeto com campo questoes
      result.questoes = data.questoes;
    } else {
      result.errors.push("JSON deve conter um array de questões ou um objeto com campo 'questoes'");
    }

    // Gerar IDs se não existirem
    result.questoes = result.questoes.map((q, i) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const questao = { ...q } as any;

      // Para drag_drop, associacao, ordenacao, lacuna - gerar IDs se necessário
      if (questao.configuracao) {
        if ("itens" in questao.configuracao) {
          questao.configuracao.itens = questao.configuracao.itens.map((item: { id?: string; texto: string }, idx: number) => ({
            ...item,
            id: item.id || `item_${i}_${idx}`,
          }));
        }
        if ("zonas" in questao.configuracao) {
          questao.configuracao.zonas = questao.configuracao.zonas.map((zona: { id?: string; label: string }, idx: number) => ({
            ...zona,
            id: zona.id || `zona_${i}_${idx}`,
          }));
        }
        if ("colunaA" in questao.configuracao) {
          questao.configuracao.colunaA = questao.configuracao.colunaA.map((item: { id?: string; texto: string }, idx: number) => ({
            ...item,
            id: item.id || `a_${i}_${idx}`,
          }));
        }
        if ("colunaB" in questao.configuracao) {
          questao.configuracao.colunaB = questao.configuracao.colunaB.map((item: { id?: string; texto: string }, idx: number) => ({
            ...item,
            id: item.id || `b_${i}_${idx}`,
          }));
        }
        if ("lacunas" in questao.configuracao) {
          questao.configuracao.lacunas = questao.configuracao.lacunas.map((lacuna: { id?: string }, idx: number) => ({
            ...lacuna,
            id: lacuna.id || `l_${i}_${idx}`,
          }));
        }
      }

      return questao;
    });
  } catch (error) {
    result.errors.push(`Erro ao processar JSON: ${error instanceof Error ? error.message : "JSON inválido"}`);
  }

  return result;
}

// Função principal para detectar tipo e fazer parse
export function parseFile(file: File, content: string | ArrayBuffer): Promise<ParseResult> {
  return new Promise((resolve) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const mimeType = file.type;

    if (extension === "json" || mimeType === "application/json") {
      resolve(parseJSON(content as string));
    } else if (extension === "csv" || mimeType === "text/csv") {
      resolve(parseCSV(content as string));
    } else if (
      extension === "xlsx" ||
      extension === "xls" ||
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel"
    ) {
      resolve(parseExcel(content as ArrayBuffer));
    } else {
      resolve({
        questoes: [],
        errors: [`Formato de arquivo não suportado: ${extension || mimeType}`],
      });
    }
  });
}

// Função utilitária para ler arquivo
export function readFile(file: File): Promise<string | ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result);
      } else {
        reject(new Error("Falha ao ler arquivo"));
      }
    };

    reader.onerror = () => reject(reader.error);

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "xlsx" || extension === "xls") {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}
