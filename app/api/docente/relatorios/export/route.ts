import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
    const { searchParams } = new URL(request.url);

    const tipo = searchParams.get("tipo") || "geral";
    const provaId = searchParams.get("provaId");
    const turmaId = searchParams.get("turmaId");
    const formato = searchParams.get("formato") || "csv";

    if (tipo === "prova" && provaId) {
      const prova = await db.prova.findUnique({
        where: { id: provaId },
        include: {
          simulado: {
            select: {
              docenteId: true,
              nome: true,
            },
          },
        },
      });

      if (!prova) {
        return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });
      }

      if (user.role !== "SUPERADMIN" && prova.simulado.docenteId !== user.id) {
        return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
      }

      const tentativas = await db.tentativa.findMany({
        where: {
          provaId,
          status: "SUBMETIDA",
        },
        include: {
          aluno: {
            select: {
              nome: true,
              email: true,
            },
          },
        },
        orderBy: {
          nota: "desc",
        },
      });

      const csvData = tentativas.map((t, index) => ({
        posicao: index + 1,
        alunoNome: t.aluno.nome,
        alunoEmail: t.aluno.email,
        nota: t.nota?.toFixed(2) || "0.00",
        acertos: `${t.totalAcertos || 0}/${t.totalQuestoes}`,
        tempoGasto: formatDuration(t.tempoGasto || 0),
        status: (t.nota || 0) >= prova.notaMinima ? "Aprovado" : "Reprovado",
        data: t.dataFim?.toLocaleString("pt-BR") || "-",
      }));

      const csv = generateCSV(csvData, [
        { key: "posicao", label: "Posição" },
        { key: "alunoNome", label: "Nome do Aluno" },
        { key: "alunoEmail", label: "Email" },
        { key: "nota", label: "Nota" },
        { key: "acertos", label: "Acertos" },
        { key: "tempoGasto", label: "Tempo" },
        { key: "status", label: "Status" },
        { key: "data", label: "Data de Submissão" },
      ]);

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="relatorio_prova_${prova.codigo}.csv"`,
        },
      });
    }

    if (tipo === "turma" && turmaId) {
      const turma = await db.turma.findUnique({
        where: { id: turmaId },
      });

      if (!turma) {
        return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
      }

      if (user.role !== "SUPERADMIN" && turma.docenteId !== user.id) {
        return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
      }

      const turmaProvas = await db.turmaProva.findMany({
        where: { turmaId },
        include: {
          prova: {
            select: {
              id: true,
              notaMinima: true,
            },
          },
        },
      });

      const provaIds = turmaProvas.map((tp) => tp.prova.id);
      const provasMap = new Map(turmaProvas.map((tp) => [tp.prova.id, tp.prova]));

      const alunosTurma = await db.turmaAluno.findMany({
        where: { turmaId },
        include: {
          aluno: {
            include: {
              tentativas: {
                where: {
                  status: "SUBMETIDA",
                  provaId: { in: provaIds },
                },
              },
            },
          },
        },
      });

      const csvData = alunosTurma.map((at) => {
        const tentativasSubmetidas = at.aluno.tentativas;
        const melhorNotaPorProva = new Map<string, number>();

        tentativasSubmetidas.forEach((t) => {
          const atual = melhorNotaPorProva.get(t.provaId) || 0;
          if ((t.nota || 0) > atual) {
            melhorNotaPorProva.set(t.provaId, t.nota || 0);
          }
        });

        const notas = Array.from(melhorNotaPorProva.values());
        const mediaGeral =
          notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;

        let aprovacoes = 0;
        melhorNotaPorProva.forEach((nota, provaId) => {
          const prova = provasMap.get(provaId);
          if (prova && nota >= prova.notaMinima) {
            aprovacoes++;
          }
        });

        return {
          alunoNome: at.aluno.nome,
          alunoEmail: at.aluno.email,
          provasRealizadas: melhorNotaPorProva.size,
          provasDisponiveis: provaIds.length,
          aprovacoes,
          mediaGeral: mediaGeral.toFixed(2),
          taxaAprovacao:
            melhorNotaPorProva.size > 0
              ? ((aprovacoes / melhorNotaPorProva.size) * 100).toFixed(1) + "%"
              : "-",
        };
      });

      csvData.sort((a, b) => parseFloat(b.mediaGeral) - parseFloat(a.mediaGeral));

      const csv = generateCSV(csvData, [
        { key: "alunoNome", label: "Nome do Aluno" },
        { key: "alunoEmail", label: "Email" },
        { key: "provasRealizadas", label: "Provas Realizadas" },
        { key: "provasDisponiveis", label: "Provas Disponíveis" },
        { key: "aprovacoes", label: "Aprovações" },
        { key: "mediaGeral", label: "Média Geral" },
        { key: "taxaAprovacao", label: "Taxa de Aprovação" },
      ]);

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="relatorio_turma_${turma.codigo}.csv"`,
        },
      });
    }

    // Relatório geral
    const simulados = await db.simulado.findMany({
      where: user.role === "SUPERADMIN" ? {} : { docenteId: user.id },
      include: {
        provas: {
          include: {
            _count: {
              select: { tentativas: true },
            },
          },
        },
      },
    });

    const csvData = simulados.map((s) => ({
      nome: s.nome,
      categoria: s.categoria,
      subcategoria: s.subcategoria || "-",
      status: s.status,
      totalProvas: s.provas.length,
      totalTentativas: s.provas.reduce((a, p) => a + p._count.tentativas, 0),
      criadoEm: s.createdAt.toLocaleDateString("pt-BR"),
    }));

    const csv = generateCSV(csvData, [
      { key: "nome", label: "Nome do Simulado" },
      { key: "categoria", label: "Categoria" },
      { key: "subcategoria", label: "Subcategoria" },
      { key: "status", label: "Status" },
      { key: "totalProvas", label: "Total de Provas" },
      { key: "totalTentativas", label: "Total de Tentativas" },
      { key: "criadoEm", label: "Criado Em" },
    ]);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="relatorio_geral.csv"`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar relatório:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[]
): string {
  const BOM = "\uFEFF";
  const headers = columns.map((col) => `"${col.label}"`).join(",");

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return '""';
        if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`;
        if (typeof value === "number") return value.toString();
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  return BOM + [headers, ...rows].join("\n");
}

function formatDuration(seconds: number): string {
  if (!seconds) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
