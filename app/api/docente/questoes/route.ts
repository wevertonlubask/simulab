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
    const tipo = searchParams.get("tipo") || "";
    const simuladoId = searchParams.get("simuladoId") || "";
    const categoria = searchParams.get("categoria") || "";
    const dificuldade = searchParams.get("dificuldade") || "";
    const ativo = searchParams.get("ativo");

    // Buscar simulados do docente para filtrar
    const simuladosIds = await db.simulado.findMany({
      where: user.role === "SUPERADMIN" ? {} : { docenteId: user.id },
      select: { id: true },
    });

    const simuladosIdsList = simuladosIds.map((s) => s.id);

    const where = {
      simuladoId: simuladoId
        ? simuladoId
        : { in: simuladosIdsList },
      ...(search && {
        OR: [
          { enunciado: { contains: search, mode: "insensitive" as const } },
          { explicacao: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(tipo && { tipo: tipo as "MULTIPLA_ESCOLHA_UNICA" | "MULTIPLA_ESCOLHA_MULTIPLA" | "ORDENACAO" | "ASSOCIACAO" | "LACUNA" | "DRAG_DROP" | "HOTSPOT" | "COMANDO" }),
      ...(dificuldade && { dificuldade: dificuldade as "FACIL" | "MEDIO" | "DIFICIL" }),
      ...(ativo !== null && ativo !== undefined && ativo !== "" && {
        ativo: ativo === "true",
      }),
    };

    // Filtrar por categoria através do simulado
    const whereWithCategoria = categoria
      ? {
          ...where,
          simulado: {
            categoria: { contains: categoria, mode: "insensitive" as const },
          },
        }
      : where;

    const [questoes, total] = await Promise.all([
      db.questao.findMany({
        where: whereWithCategoria,
        include: {
          alternativas: {
            orderBy: { ordem: "asc" },
          },
          simulado: {
            select: {
              id: true,
              nome: true,
              categoria: true,
            },
          },
          _count: {
            select: {
              provas: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.questao.count({ where: whereWithCategoria }),
    ]);

    // Buscar categorias únicas e simulados para os filtros
    const [categorias, simulados, tiposCount] = await Promise.all([
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
      db.questao.groupBy({
        by: ["tipo"],
        where: {
          simuladoId: { in: simuladosIdsList },
        },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      questoes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filtros: {
        categorias: categorias.map((c) => c.categoria),
        simulados,
        tipos: tiposCount.map((t) => ({
          tipo: t.tipo,
          count: t._count,
        })),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar questões:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
