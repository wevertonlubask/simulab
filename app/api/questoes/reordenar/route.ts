import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const reordenarBatchSchema = z.object({
  questoes: z.array(
    z.object({
      id: z.string(),
      ordem: z.number().int().min(0),
    })
  ),
});

// POST /api/questoes/reordenar - Reordenar múltiplas questões
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { questoes } = reordenarBatchSchema.parse(body);

    // Verify ownership of all questoes
    const questaoIds = questoes.map((q) => q.id);
    const existingQuestoes = await db.questao.findMany({
      where: { id: { in: questaoIds } },
      include: {
        simulado: {
          select: { docenteId: true },
        },
      },
    });

    // Check all belong to same docente
    const unauthorized = existingQuestoes.some(
      (q) =>
        q.simulado.docenteId !== session.user.id &&
        session.user.role !== "SUPERADMIN"
    );

    if (unauthorized) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Update all orders in transaction
    await db.$transaction(
      questoes.map((q) =>
        db.questao.update({
          where: { id: q.id },
          data: { ordem: q.ordem },
        })
      )
    );

    return NextResponse.json({ message: "Ordem atualizada com sucesso" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error reordering questoes:", error);
    return NextResponse.json(
      { error: "Erro ao reordenar questões" },
      { status: 500 }
    );
  }
}
