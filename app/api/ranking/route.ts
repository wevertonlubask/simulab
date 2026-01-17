import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo") || "geral"; // geral, turma, simulado
    const turmaId = searchParams.get("turmaId");
    const simuladoId = searchParams.get("simuladoId");
    const periodo = searchParams.get("periodo") || "todos"; // todos, mes, semana

    // Calcular data de início baseado no período
    let dataInicio: Date | undefined;
    if (periodo === "semana") {
      dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - 7);
    } else if (periodo === "mes") {
      dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 1);
    }

    // Base where clause para tentativas
    const tentativasWhere: Record<string, unknown> = {
      status: "SUBMETIDA",
    };

    if (dataInicio) {
      tentativasWhere.dataFim = { gte: dataInicio };
    }

    if (simuladoId) {
      tentativasWhere.prova = { simuladoId };
    }

    // Se é ranking de turma, buscar apenas alunos da turma
    let alunoIds: string[] | undefined;
    if (tipo === "turma" && turmaId) {
      const turmaAlunos = await db.turmaAluno.findMany({
        where: { turmaId },
        select: { alunoId: true },
      });
      alunoIds = turmaAlunos.map((ta) => ta.alunoId);
      tentativasWhere.alunoId = { in: alunoIds };
    }

    // Buscar todas as tentativas submetidas
    const tentativas = await db.tentativa.findMany({
      where: tentativasWhere,
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
        prova: {
          select: {
            id: true,
            nome: true,
            notaMinima: true,
            simulado: {
              select: {
                id: true,
                nome: true,
                categoria: true,
              },
            },
          },
        },
      },
    });

    // Agrupar por aluno e calcular estatísticas
    const alunoStats = new Map<
      string,
      {
        aluno: { id: string; nome: string; avatar: string | null };
        totalTentativas: number;
        totalAprovacoes: number;
        somaNotas: number;
        melhorNota: number;
        provasUnicas: Set<string>;
        pontuacaoTotal: number;
      }
    >();

    tentativas.forEach((t) => {
      const alunoId = t.alunoId;
      if (!alunoStats.has(alunoId)) {
        alunoStats.set(alunoId, {
          aluno: t.aluno,
          totalTentativas: 0,
          totalAprovacoes: 0,
          somaNotas: 0,
          melhorNota: 0,
          provasUnicas: new Set(),
          pontuacaoTotal: 0,
        });
      }

      const stats = alunoStats.get(alunoId)!;
      stats.totalTentativas++;
      stats.somaNotas += t.nota || 0;
      stats.provasUnicas.add(t.provaId);

      if (t.nota && t.nota > stats.melhorNota) {
        stats.melhorNota = t.nota;
      }

      if (t.nota && t.nota >= t.prova.notaMinima) {
        stats.totalAprovacoes++;
      }

      // Sistema de pontuação:
      // - 10 pontos base por tentativa submetida
      // - Bônus de nota (0-100 pontos baseado na nota)
      // - 50 pontos extra por aprovação
      // - Bônus de velocidade (0-20 pontos)
      const pontosBase = 10;
      const pontosNota = (t.nota || 0);
      const pontosAprovacao = t.nota && t.nota >= t.prova.notaMinima ? 50 : 0;
      const pontosVelocidade = t.tempoGasto && t.tempoGasto < 1800 ? Math.min(20, Math.floor((1800 - t.tempoGasto) / 90)) : 0;

      stats.pontuacaoTotal += pontosBase + pontosNota + pontosAprovacao + pontosVelocidade;
    });

    // Converter para array e ordenar
    const ranking = Array.from(alunoStats.values())
      .map((stats) => ({
        aluno: stats.aluno,
        totalTentativas: stats.totalTentativas,
        totalAprovacoes: stats.totalAprovacoes,
        mediaNotas: stats.totalTentativas > 0 ? stats.somaNotas / stats.totalTentativas : 0,
        melhorNota: stats.melhorNota,
        provasRealizadas: stats.provasUnicas.size,
        taxaAprovacao: stats.totalTentativas > 0 ? (stats.totalAprovacoes / stats.totalTentativas) * 100 : 0,
        pontuacao: Math.round(stats.pontuacaoTotal),
      }))
      .sort((a, b) => b.pontuacao - a.pontuacao)
      .slice(0, 100) // Top 100
      .map((item, index) => ({ ...item, posicao: index + 1 }));

    // Encontrar posição do usuário atual
    const minhasPosicao = ranking.findIndex((r) => r.aluno.id === session.user.id);
    const minhaPosicao = minhasPosicao >= 0 ? ranking[minhasPosicao] : null;

    // Se o usuário não está no top 100, buscar suas estatísticas
    let minhasEstatisticas = minhaPosicao;
    if (!minhaPosicao && session.user.role === "ALUNO") {
      const minhasStats = alunoStats.get(session.user.id);
      if (minhasStats) {
        // Calcular posição real
        const todosPontos = Array.from(alunoStats.values())
          .map((s) => Math.round(s.pontuacaoTotal))
          .sort((a, b) => b - a);
        const minhaPosicaoReal = todosPontos.findIndex((p) => p === Math.round(minhasStats.pontuacaoTotal)) + 1;

        minhasEstatisticas = {
          aluno: minhasStats.aluno,
          totalTentativas: minhasStats.totalTentativas,
          totalAprovacoes: minhasStats.totalAprovacoes,
          mediaNotas: minhasStats.totalTentativas > 0 ? minhasStats.somaNotas / minhasStats.totalTentativas : 0,
          melhorNota: minhasStats.melhorNota,
          provasRealizadas: minhasStats.provasUnicas.size,
          taxaAprovacao: minhasStats.totalTentativas > 0 ? (minhasStats.totalAprovacoes / minhasStats.totalTentativas) * 100 : 0,
          pontuacao: Math.round(minhasStats.pontuacaoTotal),
          posicao: minhaPosicaoReal,
        };
      }
    }

    // Estatísticas gerais
    const estatisticas = {
      totalParticipantes: alunoStats.size,
      totalTentativas: tentativas.length,
      mediaGeralNotas: tentativas.length > 0
        ? tentativas.reduce((acc, t) => acc + (t.nota || 0), 0) / tentativas.length
        : 0,
    };

    return NextResponse.json({
      ranking: ranking.slice(0, 50), // Top 50 para exibição
      minhasEstatisticas,
      estatisticas,
    });
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    return NextResponse.json(
      { error: "Erro ao buscar ranking" },
      { status: 500 }
    );
  }
}
