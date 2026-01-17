import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { format, subDays, eachDayOfInterval } from "date-fns";

export async function GET() {
  try {
    const user = await requireRole(["ALUNO"]);

    // Buscar todas as tentativas finalizadas
    const tentativas = await db.tentativa.findMany({
      where: {
        alunoId: user.id,
        status: "SUBMETIDA",
      },
      include: {
        prova: {
          include: {
            simulado: true,
          },
        },
        respostas: true,
      },
      orderBy: { dataFim: "asc" },
    });

    if (tentativas.length === 0) {
      return NextResponse.json({
        temDados: false,
        mensagem: "Realize algumas provas para ver suas estatísticas",
      });
    }

    // Estatísticas gerais
    const totalTentativas = tentativas.length;
    const aprovacoes = tentativas.filter(
      (t) => (t.nota || 0) >= t.prova.notaMinima
    );
    const totalAprovacoes = aprovacoes.length;
    const notas = tentativas.map((t) => t.nota || 0);
    const mediaGeral =
      notas.reduce((sum, n) => sum + n, 0) / totalTentativas;
    const melhorNota = Math.max(...notas);
    const piorNota = Math.min(...notas);

    // Tempo total de estudo
    const tempoTotal = tentativas.reduce((sum, t) => sum + (t.tempoGasto || 0), 0);

    // Total de questões
    const totalQuestoes = tentativas.reduce(
      (sum, t) => sum + t.respostas.length,
      0
    );
    const questoesCorretas = tentativas.reduce(
      (sum, t) => sum + t.respostas.filter((r) => r.correta).length,
      0
    );

    // Evolução mensal (últimos 6 meses)
    const evolucaoMensal = tentativas.reduce((acc, t) => {
      const mes = format(t.dataFim || t.dataInicio, "yyyy-MM");
      if (!acc[mes]) {
        acc[mes] = { soma: 0, count: 0, aprovacoes: 0 };
      }
      acc[mes].soma += t.nota || 0;
      acc[mes].count++;
      if ((t.nota || 0) >= t.prova.notaMinima) {
        acc[mes].aprovacoes++;
      }
      return acc;
    }, {} as Record<string, { soma: number; count: number; aprovacoes: number }>);

    const evolucao = Object.entries(evolucaoMensal)
      .map(([mes, data]) => ({
        mes,
        media: Math.round(data.soma / data.count),
        tentativas: data.count,
        taxaAprovacao: Math.round((data.aprovacoes / data.count) * 100),
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-6);

    // Desempenho por categoria
    const porCategoria = tentativas.reduce((acc, t) => {
      const cat = t.prova.simulado.categoria;
      if (!acc[cat]) {
        acc[cat] = {
          total: 0,
          soma: 0,
          aprovacoes: 0,
          tempoTotal: 0,
        };
      }
      acc[cat].total++;
      acc[cat].soma += t.nota || 0;
      acc[cat].tempoTotal += t.tempoGasto || 0;
      if ((t.nota || 0) >= t.prova.notaMinima) {
        acc[cat].aprovacoes++;
      }
      return acc;
    }, {} as Record<string, { total: number; soma: number; aprovacoes: number; tempoTotal: number }>);

    const categorias = Object.entries(porCategoria)
      .map(([categoria, data]) => ({
        categoria,
        media: Math.round(data.soma / data.total),
        tentativas: data.total,
        taxaAprovacao: Math.round((data.aprovacoes / data.total) * 100),
        tempoMedio: Math.round(data.tempoTotal / data.total / 60), // em minutos
      }))
      .sort((a, b) => b.media - a.media);

    // Distribuição de notas
    const distribuicaoNotas = {
      "0-30": 0,
      "31-50": 0,
      "51-70": 0,
      "71-90": 0,
      "91-100": 0,
    };

    tentativas.forEach((t) => {
      const nota = t.nota || 0;
      if (nota <= 30) distribuicaoNotas["0-30"]++;
      else if (nota <= 50) distribuicaoNotas["31-50"]++;
      else if (nota <= 70) distribuicaoNotas["51-70"]++;
      else if (nota <= 90) distribuicaoNotas["71-90"]++;
      else distribuicaoNotas["91-100"]++;
    });

    // Atividade nos últimos 30 dias
    const ultimos30Dias = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    const atividadePorDia = tentativas.reduce((acc, t) => {
      const dia = format(t.dataFim || t.dataInicio, "yyyy-MM-dd");
      if (!acc[dia]) {
        acc[dia] = 0;
      }
      acc[dia]++;
      return acc;
    }, {} as Record<string, number>);

    const atividade = ultimos30Dias.map((date) => {
      const dia = format(date, "yyyy-MM-dd");
      return {
        data: format(date, "dd/MM"),
        tentativas: atividadePorDia[dia] || 0,
      };
    });

    // Calcular streak (dias consecutivos)
    let streakAtual = 0;
    let maiorStreak = 0;
    let streakTemp = 0;

    for (let i = ultimos30Dias.length - 1; i >= 0; i--) {
      const dia = format(ultimos30Dias[i], "yyyy-MM-dd");
      if (atividadePorDia[dia]) {
        streakTemp++;
        if (i === ultimos30Dias.length - 1 || streakAtual > 0) {
          streakAtual = streakTemp;
        }
      } else {
        if (streakTemp > maiorStreak) {
          maiorStreak = streakTemp;
        }
        streakTemp = 0;
        if (i === ultimos30Dias.length - 1) {
          streakAtual = 0;
        }
      }
    }
    if (streakTemp > maiorStreak) {
      maiorStreak = streakTemp;
    }

    // Top 5 melhores provas
    const melhorNotaPorProva = new Map<
      string,
      { provaId: string; provaNome: string; simulado: string; nota: number }
    >();

    tentativas.forEach((t) => {
      const atual = melhorNotaPorProva.get(t.provaId);
      if (!atual || (t.nota || 0) > atual.nota) {
        melhorNotaPorProva.set(t.provaId, {
          provaId: t.provaId,
          provaNome: t.prova.nome,
          simulado: t.prova.simulado.nome,
          nota: t.nota || 0,
        });
      }
    });

    const melhoresNotas = Array.from(melhorNotaPorProva.values())
      .sort((a, b) => b.nota - a.nota)
      .slice(0, 5);

    return NextResponse.json({
      temDados: true,
      resumo: {
        totalTentativas,
        totalAprovacoes,
        taxaAprovacao: Math.round((totalAprovacoes / totalTentativas) * 100),
        mediaGeral: Math.round(mediaGeral),
        melhorNota: Math.round(melhorNota),
        piorNota: Math.round(piorNota),
        tempoTotal,
        totalQuestoes,
        questoesCorretas,
        taxaAcerto: Math.round((questoesCorretas / totalQuestoes) * 100),
        streakAtual,
        maiorStreak,
      },
      evolucao,
      categorias,
      distribuicaoNotas: Object.entries(distribuicaoNotas).map(([faixa, count]) => ({
        faixa,
        count,
      })),
      atividade,
      melhoresNotas,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
