import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: {
      type: string;
      id: string;
      title: string;
      subtitle?: string;
      url: string;
    }[] = [];

    const isDocente = session.user.role === "DOCENTE" || session.user.role === "SUPERADMIN";
    const isAluno = session.user.role === "ALUNO";

    // Buscar turmas
    const turmasWhere = isDocente
      ? session.user.role === "SUPERADMIN"
        ? { nome: { contains: query, mode: "insensitive" as const } }
        : { docenteId: session.user.id, nome: { contains: query, mode: "insensitive" as const } }
      : {
          alunos: { some: { alunoId: session.user.id } },
          nome: { contains: query, mode: "insensitive" as const },
        };

    const turmas = await db.turma.findMany({
      where: turmasWhere,
      take: 5,
      select: {
        id: true,
        nome: true,
        codigo: true,
      },
    });

    turmas.forEach((t) => {
      results.push({
        type: "turma",
        id: t.id,
        title: t.nome,
        subtitle: `Código: ${t.codigo}`,
        url: isDocente ? `/docente/turmas/${t.id}` : `/aluno/turmas`,
      });
    });

    // Buscar simulados (apenas docente)
    if (isDocente) {
      const simuladosWhere =
        session.user.role === "SUPERADMIN"
          ? { nome: { contains: query, mode: "insensitive" as const } }
          : { docenteId: session.user.id, nome: { contains: query, mode: "insensitive" as const } };

      const simulados = await db.simulado.findMany({
        where: simuladosWhere,
        take: 5,
        select: {
          id: true,
          nome: true,
          categoria: true,
        },
      });

      simulados.forEach((s) => {
        results.push({
          type: "simulado",
          id: s.id,
          title: s.nome,
          subtitle: s.categoria,
          url: `/docente/simulados/${s.id}`,
        });
      });
    }

    // Buscar provas
    if (isDocente) {
      const provasWhere =
        session.user.role === "SUPERADMIN"
          ? {
              OR: [
                { nome: { contains: query, mode: "insensitive" as const } },
                { codigo: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {
              simulado: { docenteId: session.user.id },
              OR: [
                { nome: { contains: query, mode: "insensitive" as const } },
                { codigo: { contains: query, mode: "insensitive" as const } },
              ],
            };

      const provas = await db.prova.findMany({
        where: provasWhere,
        take: 5,
        select: {
          id: true,
          nome: true,
          codigo: true,
          simulado: {
            select: { nome: true },
          },
        },
      });

      provas.forEach((p) => {
        results.push({
          type: "prova",
          id: p.id,
          title: p.nome,
          subtitle: `${p.simulado.nome} - ${p.codigo}`,
          url: `/docente/provas/${p.id}`,
        });
      });
    } else if (isAluno) {
      // Buscar provas disponíveis para o aluno
      const turmaIds = await db.turmaAluno
        .findMany({
          where: { alunoId: session.user.id },
          select: { turmaId: true },
        })
        .then((t) => t.map((ta) => ta.turmaId));

      const provasDisponiveis = await db.turmaProva.findMany({
        where: {
          turmaId: { in: turmaIds },
          prova: {
            status: "PUBLICADA",
            OR: [
              { nome: { contains: query, mode: "insensitive" as const } },
              { codigo: { contains: query, mode: "insensitive" as const } },
            ],
          },
        },
        take: 5,
        include: {
          prova: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              simulado: {
                select: { nome: true },
              },
            },
          },
        },
      });

      const uniqueProvas = new Map<string, typeof provasDisponiveis[0]["prova"]>();
      provasDisponiveis.forEach((tp) => {
        if (!uniqueProvas.has(tp.prova.id)) {
          uniqueProvas.set(tp.prova.id, tp.prova);
        }
      });

      uniqueProvas.forEach((p) => {
        results.push({
          type: "prova",
          id: p.id,
          title: p.nome,
          subtitle: `${p.simulado.nome} - ${p.codigo}`,
          url: `/aluno/provas/${p.id}`,
        });
      });
    }

    // Buscar alunos (apenas docente)
    if (isDocente) {
      const turmaIdsDocente =
        session.user.role === "SUPERADMIN"
          ? undefined
          : await db.turma
              .findMany({
                where: { docenteId: session.user.id },
                select: { id: true },
              })
              .then((t) => t.map((turma) => turma.id));

      const alunosWhere =
        session.user.role === "SUPERADMIN"
          ? {
              role: "ALUNO" as const,
              OR: [
                { nome: { contains: query, mode: "insensitive" as const } },
                { email: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {
              role: "ALUNO" as const,
              turmasAluno: {
                some: { turmaId: { in: turmaIdsDocente } },
              },
              OR: [
                { nome: { contains: query, mode: "insensitive" as const } },
                { email: { contains: query, mode: "insensitive" as const } },
              ],
            };

      const alunos = await db.user.findMany({
        where: alunosWhere,
        take: 5,
        select: {
          id: true,
          nome: true,
          email: true,
        },
      });

      alunos.forEach((a) => {
        results.push({
          type: "aluno",
          id: a.id,
          title: a.nome,
          subtitle: a.email,
          url: `/docente/relatorios?aluno=${a.id}`,
        });
      });
    }

    return NextResponse.json({ results: results.slice(0, 15) });
  } catch (error) {
    console.error("Erro na busca:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
