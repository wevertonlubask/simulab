import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireRole(["SUPERADMIN"]);

    // Estatísticas gerais
    const [
      totalUsers,
      totalAlunos,
      totalDocentes,
      totalSimulados,
      totalProvas,
      totalTentativas,
      totalTurmas,
      totalQuestoes,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "ALUNO" } }),
      db.user.count({ where: { role: "DOCENTE" } }),
      db.simulado.count(),
      db.prova.count(),
      db.tentativa.count(),
      db.turma.count(),
      db.questao.count(),
    ]);

    // Tentativas por status
    const tentativasPorStatus = await db.tentativa.groupBy({
      by: ["status"],
      _count: true,
    });

    // Simulados por status
    const simuladosPorStatus = await db.simulado.groupBy({
      by: ["status"],
      _count: true,
    });

    // Provas por status
    const provasPorStatus = await db.prova.groupBy({
      by: ["status"],
      _count: true,
    });

    // Usuários criados nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const novosUsuarios = await db.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Tentativas nos últimos 30 dias
    const novasTentativas = await db.tentativa.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Top 5 categorias mais usadas
    const categorias = await db.simulado.groupBy({
      by: ["categoria"],
      _count: true,
      orderBy: {
        _count: {
          categoria: "desc",
        },
      },
      take: 5,
    });

    // Atividade recente (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const atividadeRecente = {
      tentativas: await db.tentativa.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      usuarios: await db.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      simulados: await db.simulado.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
    };

    return NextResponse.json({
      totais: {
        users: totalUsers,
        alunos: totalAlunos,
        docentes: totalDocentes,
        superadmins: totalUsers - totalAlunos - totalDocentes,
        simulados: totalSimulados,
        provas: totalProvas,
        tentativas: totalTentativas,
        turmas: totalTurmas,
        questoes: totalQuestoes,
      },
      porStatus: {
        tentativas: tentativasPorStatus.reduce((acc, t) => {
          acc[t.status] = t._count;
          return acc;
        }, {} as Record<string, number>),
        simulados: simuladosPorStatus.reduce((acc, s) => {
          acc[s.status] = s._count;
          return acc;
        }, {} as Record<string, number>),
        provas: provasPorStatus.reduce((acc, p) => {
          acc[p.status] = p._count;
          return acc;
        }, {} as Record<string, number>),
      },
      ultimos30Dias: {
        novosUsuarios,
        novasTentativas,
      },
      categorias: categorias.map((c) => ({
        nome: c.categoria,
        total: c._count,
      })),
      atividadeRecente,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
