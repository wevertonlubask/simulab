import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { gerarProvas } from "@/lib/prova-generator";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const gerarProvasRequestSchema = z.object({
  questoesPorProva: z.number().int().min(5).max(100),
  quantidadeProvas: z.number().int().min(1).max(50),
  dificuldades: z.array(z.string()).optional(),
  percentuais: z
    .object({
      FACIL: z.number().min(0).max(100),
      MEDIO: z.number().min(0).max(100),
      DIFICIL: z.number().min(0).max(100),
    })
    .refine((p) => p.FACIL + p.MEDIO + p.DIFICIL === 100, "Percentuais devem somar 100%")
    .optional(),
  embaralharQuestoes: z.boolean().optional().default(true),
  embaralharAlternativas: z.boolean().optional().default(true),
});

// POST /api/simulados/[id]/gerar-provas - Gerar provas automaticamente
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: simuladoId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verify simulado ownership
    const simulado = await db.simulado.findUnique({
      where: { id: simuladoId },
      select: { docenteId: true, nome: true },
    });

    if (!simulado) {
      return NextResponse.json(
        { error: "Simulado não encontrado" },
        { status: 404 }
      );
    }

    if (
      simulado.docenteId !== session.user.id &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = gerarProvasRequestSchema.parse(body);

    const result = await gerarProvas({
      simuladoId,
      questoesPorProva: validatedData.questoesPorProva,
      quantidadeProvas: validatedData.quantidadeProvas,
      dificuldades: validatedData.dificuldades,
      percentuais: validatedData.percentuais,
      embaralharQuestoes: validatedData.embaralharQuestoes,
      embaralharAlternativas: validatedData.embaralharAlternativas,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error generating provas:", error);
    return NextResponse.json(
      { error: "Erro ao gerar provas" },
      { status: 500 }
    );
  }
}
