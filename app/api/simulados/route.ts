import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { simuladoSchema } from "@/lib/validations/simulado";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// GET /api/simulados - Listar simulados do docente
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "DOCENTE" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria");
    const status = searchParams.get("status");
    const busca = searchParams.get("busca");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    // SUPERADMIN vê todos os simulados, DOCENTE vê apenas os seus
    const where: Prisma.SimuladoWhereInput = {};

    if (session.user.role !== "SUPERADMIN") {
      where.docenteId = session.user.id;
    }

    if (categoria && categoria !== "todos") {
      where.categoria = categoria;
    }

    if (status && status !== "todos") {
      where.status = status as "ATIVO" | "INATIVO" | "EM_EDICAO";
    }

    if (busca) {
      where.OR = [
        { nome: { contains: busca, mode: "insensitive" } },
        { descricao: { contains: busca, mode: "insensitive" } },
      ];
    }

    const [simulados, total] = await Promise.all([
      db.simulado.findMany({
        where,
        include: {
          _count: {
            select: {
              questoes: true,
              provas: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.simulado.count({ where }),
    ]);

    return NextResponse.json({
      simulados,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching simulados:", error);
    return NextResponse.json(
      { error: "Erro ao buscar simulados" },
      { status: 500 }
    );
  }
}

// POST /api/simulados - Criar novo simulado
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "DOCENTE" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Verificar se o usuário existe no banco (sessão pode estar desatualizada)
    const userExists = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "Sessão inválida. Por favor, faça login novamente." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = simuladoSchema.parse(body);

    // Check if name is unique for this docente
    const existingSimulado = await db.simulado.findUnique({
      where: {
        nome_docenteId: {
          nome: validatedData.nome,
          docenteId: session.user.id,
        },
      },
    });

    if (existingSimulado) {
      return NextResponse.json(
        { error: "Você já possui um simulado com este nome" },
        { status: 400 }
      );
    }

    const simulado = await db.simulado.create({
      data: {
        ...validatedData,
        docenteId: session.user.id,
      },
      include: {
        _count: {
          select: {
            questoes: true,
            provas: true,
          },
        },
      },
    });

    return NextResponse.json(simulado, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating simulado:", error);
    return NextResponse.json(
      { error: "Erro ao criar simulado" },
      { status: 500 }
    );
  }
}
