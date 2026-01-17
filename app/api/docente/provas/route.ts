import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const simuladoId = searchParams.get("simuladoId") || "";
    const turmaId = searchParams.get("turmaId") || "";
    const categoria = searchParams.get("categoria") || "";

    // Buscar simulados do docente para filtrar
    const simuladosIds = await db.simulado.findMany({
      where: user.role === "SUPERADMIN" ? {} : { docenteId: user.id },
      select: { id: true },
    });

    const simuladosIdsList = simuladosIds.map((s) => s.id);

    const where = {
      simulado: simuladoId
        ? { id: simuladoId }
        : { id: { in: simuladosIdsList } },
      ...(search && {
        OR: [
          { nome: { contains: search, mode: "insensitive" as const } },
          { descricao: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && { status: status as "RASCUNHO" | "PUBLICADA" | "ENCERRADA" }),
      ...(turmaId && {
        turmas: {
          some: { turmaId },
        },
      }),
    };

    // Filtrar por categoria através do simulado
    const whereWithCategoria = categoria
      ? {
          ...where,
          simulado: {
            ...where.simulado,
            categoria: { contains: categoria, mode: "insensitive" as const },
          },
        }
      : where;

    const [provas, total] = await Promise.all([
      db.prova.findMany({
        where: whereWithCategoria,
        include: {
          simulado: {
            select: {
              id: true,
              nome: true,
              categoria: true,
            },
          },
          questoes: {
            select: { id: true },
          },
          turmas: {
            include: {
              turma: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
          _count: {
            select: {
              tentativas: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.prova.count({ where: whereWithCategoria }),
    ]);

    // Buscar filtros disponíveis
    const [categorias, simulados, turmas, statusCount] = await Promise.all([
      db.simulado.findMany({
        where: user.role === "SUPERADMIN" ? {} : { docenteId: user.id },
        select: { categoria: true },
        distinct: ["categoria"],
      }),
      db.simulado.findMany({
        where: user.role === "SUPERADMIN" ? {} : { docenteId: user.id },
        select: { id: true, nome: true },
        orderBy: { nome: "asc" },
      }),
      db.turma.findMany({
        where: user.role === "SUPERADMIN" ? {} : { docenteId: user.id },
        select: { id: true, nome: true },
        orderBy: { nome: "asc" },
      }),
      db.prova.groupBy({
        by: ["status"],
        where: {
          simulado: { id: { in: simuladosIdsList } },
        },
        _count: true,
      }),
    ]);

    // Calcular estatísticas
    const estatisticas = {
      total,
      rascunho: statusCount.find((s) => s.status === "RASCUNHO")?._count || 0,
      publicadas: statusCount.find((s) => s.status === "PUBLICADA")?._count || 0,
      encerradas: statusCount.find((s) => s.status === "ENCERRADA")?._count || 0,
    };

    return NextResponse.json({
      provas: provas.map((p) => ({
        ...p,
        totalQuestoes: p.questoes.length,
        totalTentativas: p._count.tentativas,
        turmas: p.turmas.map((tp) => tp.turma),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filtros: {
        categorias: categorias.map((c) => c.categoria),
        simulados,
        turmas,
      },
      estatisticas,
    });
  } catch (error) {
    console.error("Erro ao buscar provas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
