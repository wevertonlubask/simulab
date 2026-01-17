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
    const simuladoId = searchParams.get("simuladoId");

    // Filtro base: apenas provas/simulados do docente (exceto SUPERADMIN)
    const baseWhere = user.role === "SUPERADMIN"
      ? {}
      : { simulado: { docenteId: user.id } };

    if (tipo === "prova" && provaId) {
      // Relatório detalhado de uma prova específica
      const prova = await db.prova.findUnique({
        where: { id: provaId },
        include: {
          simulado: {
            select: {
              id: true,
              nome: true,
              categoria: true,
              docenteId: true,
            },
          },
          questoes: {
            include: {
              questao: {
                select: {
                  id: true,
                  enunciado: true,
                  tipo: true,
                  dificuldade: true,
                },
              },
            },
            orderBy: { ordem: "asc" },
          },
        },
      });

      if (!prova) {
        return NextResponse.json(
          { error: "Prova não encontrada" },
          { status: 404 }
        );
      }

      // Verificar acesso
      if (user.role !== "SUPERADMIN" && prova.simulado.docenteId !== user.id) {
        return NextResponse.json(
          { error: "Sem permissão" },
          { status: 403 }
        );
      }

      // Buscar todas as tentativas da prova
      const tentativas = await db.tentativa.findMany({
        where: {
          provaId,
          status: "SUBMETIDA",
        },
        include: {
          aluno: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          respostas: true,
        },
        orderBy: {
          nota: "desc",
        },
      });

      // Estatísticas gerais
      const totalTentativas = tentativas.length;
      const aprovacoes = tentativas.filter(
        (t) => (t.nota || 0) >= prova.notaMinima
      ).length;
      const notas = tentativas.map((t) => t.nota || 0);
      const mediaGeral = notas.length > 0
        ? notas.reduce((a, b) => a + b, 0) / notas.length
        : 0;
      const notaMaxima = notas.length > 0 ? Math.max(...notas) : 0;
      const notaMinima = notas.length > 0 ? Math.min(...notas) : 0;

      // Desvio padrão
      const desvioPadrao = notas.length > 0
        ? Math.sqrt(
            notas.reduce((acc, nota) => acc + Math.pow(nota - mediaGeral, 2), 0) /
              notas.length
          )
        : 0;

      // Estatísticas por questão
      const estatisticasQuestoes = await Promise.all(
        prova.questoes.map(async (pq) => {
          const respostas = await db.resposta.findMany({
            where: {
              questaoId: pq.questaoId,
              tentativa: {
                provaId,
                status: "SUBMETIDA",
              },
            },
          });

          const totalRespostas = respostas.length;
          const acertos = respostas.filter((r) => r.correta).length;
          const taxaAcerto = totalRespostas > 0
            ? (acertos / totalRespostas) * 100
            : 0;

          return {
            ordem: pq.ordem,
            questaoId: pq.questaoId,
            enunciado: pq.questao.enunciado.substring(0, 100) + "...",
            tipo: pq.questao.tipo,
            dificuldade: pq.questao.dificuldade,
            totalRespostas,
            acertos,
            taxaAcerto,
          };
        })
      );

      // Ranking de alunos
      const ranking = tentativas.slice(0, 10).map((t, index) => ({
        posicao: index + 1,
        alunoId: t.aluno.id,
        alunoNome: t.aluno.nome,
        alunoEmail: t.aluno.email,
        nota: t.nota,
        tempoGasto: t.tempoGasto,
        acertos: t.totalAcertos,
        aprovado: (t.nota || 0) >= prova.notaMinima,
      }));

      return NextResponse.json({
        prova: {
          id: prova.id,
          nome: prova.nome,
          codigo: prova.codigo,
          notaMinima: prova.notaMinima,
          tempoLimite: prova.tempoLimite,
          simulado: prova.simulado,
        },
        estatisticas: {
          totalTentativas,
          aprovacoes,
          reprovacoes: totalTentativas - aprovacoes,
          taxaAprovacao: totalTentativas > 0
            ? (aprovacoes / totalTentativas) * 100
            : 0,
          mediaGeral,
          notaMaxima,
          notaMinima,
          desvioPadrao,
        },
        estatisticasQuestoes,
        ranking,
      });
    }

    if (tipo === "turma" && turmaId) {
      // Relatório de desempenho de uma turma
      const turma = await db.turma.findUnique({
        where: { id: turmaId },
        include: {
          _count: {
            select: { alunos: true },
          },
        },
      });

      if (!turma) {
        return NextResponse.json(
          { error: "Turma não encontrada" },
          { status: 404 }
        );
      }

      // Verificar acesso
      if (user.role !== "SUPERADMIN" && turma.docenteId !== user.id) {
        return NextResponse.json(
          { error: "Sem permissão" },
          { status: 403 }
        );
      }

      // Provas disponíveis para a turma (via TurmaProva)
      const turmaProvas = await db.turmaProva.findMany({
        where: { turmaId },
        include: {
          prova: {
            select: {
              id: true,
              nome: true,
              notaMinima: true,
            },
          },
        },
      });

      const provasDisponiveis = turmaProvas.map((tp) => tp.prova);
      const provaIds = provasDisponiveis.map((p) => p.id);

      // Buscar alunos da turma com suas tentativas
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
                include: {
                  prova: {
                    select: {
                      id: true,
                      nome: true,
                      notaMinima: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Estatísticas por aluno
      const desempenhoAlunos = alunosTurma.map((at) => {
        const tentativasSubmetidas = at.aluno.tentativas;
        const totalTentativas = tentativasSubmetidas.length;

        // Melhor nota por prova
        const melhorNotaPorProva = new Map<string, number>();
        tentativasSubmetidas.forEach((t) => {
          const atual = melhorNotaPorProva.get(t.provaId) || 0;
          if ((t.nota || 0) > atual) {
            melhorNotaPorProva.set(t.provaId, t.nota || 0);
          }
        });

        const provasRealizadas = melhorNotaPorProva.size;
        const notas = Array.from(melhorNotaPorProva.values());
        const mediaGeral = notas.length > 0
          ? notas.reduce((a, b) => a + b, 0) / notas.length
          : 0;

        // Aprovações (considerando melhor nota)
        let aprovacoes = 0;
        melhorNotaPorProva.forEach((nota, provaId) => {
          const prova = provasDisponiveis.find((p) => p.id === provaId);
          if (prova && nota >= prova.notaMinima) {
            aprovacoes++;
          }
        });

        return {
          alunoId: at.aluno.id,
          alunoNome: at.aluno.nome,
          alunoEmail: at.aluno.email,
          totalTentativas,
          provasRealizadas,
          provasDisponiveis: provasDisponiveis.length,
          aprovacoes,
          mediaGeral,
          taxaAprovacao: provasRealizadas > 0
            ? (aprovacoes / provasRealizadas) * 100
            : 0,
        };
      });

      // Ordenar por média
      desempenhoAlunos.sort((a, b) => b.mediaGeral - a.mediaGeral);

      // Estatísticas gerais da turma
      const mediasAlunos = desempenhoAlunos
        .filter((a) => a.provasRealizadas > 0)
        .map((a) => a.mediaGeral);

      const mediaTurma = mediasAlunos.length > 0
        ? mediasAlunos.reduce((a, b) => a + b, 0) / mediasAlunos.length
        : 0;

      return NextResponse.json({
        turma: {
          id: turma.id,
          nome: turma.nome,
          codigo: turma.codigo,
          totalAlunos: turma._count.alunos,
        },
        estatisticas: {
          totalAlunos: alunosTurma.length,
          alunosAtivos: desempenhoAlunos.filter((a) => a.provasRealizadas > 0).length,
          provasDisponiveis: provasDisponiveis.length,
          mediaTurma,
        },
        desempenhoAlunos,
        provasDisponiveis,
      });
    }

    if (tipo === "simulado" && simuladoId) {
      // Relatório de um simulado específico
      const simulado = await db.simulado.findUnique({
        where: { id: simuladoId },
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

      if (!simulado) {
        return NextResponse.json(
          { error: "Simulado não encontrado" },
          { status: 404 }
        );
      }

      // Verificar acesso
      if (user.role !== "SUPERADMIN" && simulado.docenteId !== user.id) {
        return NextResponse.json(
          { error: "Sem permissão" },
          { status: 403 }
        );
      }

      // Estatísticas por prova do simulado
      const estatisticasProvas = await Promise.all(
        simulado.provas.map(async (prova) => {
          const tentativas = await db.tentativa.findMany({
            where: {
              provaId: prova.id,
              status: "SUBMETIDA",
            },
          });

          const notas = tentativas.map((t) => t.nota || 0);
          const aprovacoes = tentativas.filter(
            (t) => (t.nota || 0) >= prova.notaMinima
          ).length;

          return {
            provaId: prova.id,
            provaNome: prova.nome,
            provaCodigo: prova.codigo,
            totalTentativas: tentativas.length,
            aprovacoes,
            taxaAprovacao: tentativas.length > 0
              ? (aprovacoes / tentativas.length) * 100
              : 0,
            mediaNotas: notas.length > 0
              ? notas.reduce((a, b) => a + b, 0) / notas.length
              : 0,
          };
        })
      );

      return NextResponse.json({
        simulado: {
          id: simulado.id,
          nome: simulado.nome,
          categoria: simulado.categoria,
          totalProvas: simulado.provas.length,
        },
        estatisticasProvas,
      });
    }

    // Relatório geral (dashboard do docente)
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

    const turmas = await db.turma.findMany({
      where: user.role === "SUPERADMIN" ? {} : { docenteId: user.id },
      include: {
        _count: {
          select: { alunos: true },
        },
      },
    });

    // Estatísticas gerais
    const totalSimulados = simulados.length;
    const totalProvas = simulados.reduce((acc, s) => acc + s.provas.length, 0);
    const totalTentativas = simulados.reduce(
      (acc, s) => acc + s.provas.reduce((a, p) => a + p._count.tentativas, 0),
      0
    );
    const totalTurmas = turmas.length;
    const totalAlunos = turmas.reduce((acc, t) => acc + t._count.alunos, 0);

    // Top 5 simulados por tentativas
    const topSimulados = simulados
      .map((s) => ({
        id: s.id,
        nome: s.nome,
        categoria: s.categoria,
        totalProvas: s.provas.length,
        totalTentativas: s.provas.reduce((a, p) => a + p._count.tentativas, 0),
      }))
      .sort((a, b) => b.totalTentativas - a.totalTentativas)
      .slice(0, 5);

    // Top 5 turmas por alunos
    const topTurmas = turmas
      .map((t) => ({
        id: t.id,
        nome: t.nome,
        codigo: t.codigo,
        totalAlunos: t._count.alunos,
      }))
      .sort((a, b) => b.totalAlunos - a.totalAlunos)
      .slice(0, 5);

    return NextResponse.json({
      estatisticas: {
        totalSimulados,
        totalProvas,
        totalTentativas,
        totalTurmas,
        totalAlunos,
      },
      topSimulados,
      topTurmas,
    });
  } catch (error) {
    console.error("Erro ao buscar relatórios:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
