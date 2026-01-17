import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Gerar código de 6 caracteres alfanuméricos
function generateTurmaCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const createTurmaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  descricao: z.string().max(500).optional(),
});

// GET - Listar turmas do docente
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "DOCENTE" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const busca = searchParams.get("busca");

    // SUPERADMIN vê todas as turmas, DOCENTE vê apenas as suas
    const whereClause: Record<string, unknown> = {};

    if (session.user.role !== "SUPERADMIN") {
      whereClause.docenteId = session.user.id;
    }

    if (status === "ativas") {
      whereClause.ativa = true;
    } else if (status === "inativas") {
      whereClause.ativa = false;
    }

    if (busca) {
      whereClause.OR = [
        { nome: { contains: busca, mode: "insensitive" } },
        { codigo: { contains: busca, mode: "insensitive" } },
      ];
    }

    const turmas = await db.turma.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            alunos: true,
            provas: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ turmas });
  } catch (error) {
    console.error("Erro ao listar turmas:", error);
    return NextResponse.json(
      { error: "Erro ao listar turmas" },
      { status: 500 }
    );
  }
}

// POST - Criar nova turma
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "DOCENTE" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const validation = createTurmaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Gerar código único
    let codigo = generateTurmaCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.turma.findUnique({ where: { codigo } });
      if (!existing) break;
      codigo = generateTurmaCode();
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: "Erro ao gerar código da turma" },
        { status: 500 }
      );
    }

    const turma = await db.turma.create({
      data: {
        nome: validation.data.nome,
        descricao: validation.data.descricao,
        codigo,
        docenteId: session.user.id,
      },
      include: {
        _count: {
          select: {
            alunos: true,
            provas: true,
          },
        },
      },
    });

    return NextResponse.json({ turma }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar turma:", error);
    return NextResponse.json({ error: "Erro ao criar turma" }, { status: 500 });
  }
}
