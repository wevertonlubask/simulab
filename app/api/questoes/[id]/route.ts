import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { questaoUpdateSchema, validateMultiplaEscolha } from "@/lib/validations/questao";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/questoes/[id] - Detalhes da questão
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const questao = await db.questao.findUnique({
      where: { id },
      include: {
        alternativas: {
          orderBy: { ordem: "asc" },
        },
        simulado: {
          select: {
            id: true,
            nome: true,
            docenteId: true,
          },
        },
      },
    });

    if (!questao) {
      return NextResponse.json(
        { error: "Questão não encontrada" },
        { status: 404 }
      );
    }

    if (
      questao.simulado.docenteId !== session.user.id &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json(questao);
  } catch (error) {
    console.error("Error fetching questao:", error);
    return NextResponse.json(
      { error: "Erro ao buscar questão" },
      { status: 500 }
    );
  }
}

// PUT /api/questoes/[id] - Atualizar questão
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const existingQuestao = await db.questao.findUnique({
      where: { id },
      include: {
        simulado: {
          select: { docenteId: true },
        },
      },
    });

    if (!existingQuestao) {
      return NextResponse.json(
        { error: "Questão não encontrada" },
        { status: 404 }
      );
    }

    if (
      existingQuestao.simulado.docenteId !== session.user.id &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = questaoUpdateSchema.parse(body);

    // Validate multiple choice if tipo and alternativas present
    if (validatedData.tipo && validatedData.alternativas) {
      const validationError = validateMultiplaEscolha(
        validatedData.tipo,
        validatedData.alternativas
      );
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    // Update questao
    const updateData: Record<string, unknown> = { ...validatedData };
    delete updateData.alternativas;

    // Incluir configuração do body original (para tipos avançados)
    if (body.configuracao !== undefined) {
      updateData.configuracao = body.configuracao;
    }

    const questao = await db.questao.update({
      where: { id },
      data: updateData,
    });

    // Update alternativas if provided
    if (validatedData.alternativas) {
      // Delete existing alternativas
      await db.alternativa.deleteMany({
        where: { questaoId: id },
      });

      // Create new alternativas
      await db.alternativa.createMany({
        data: validatedData.alternativas.map((alt, index) => ({
          questaoId: id,
          texto: alt.texto,
          imagemUrl: alt.imagemUrl,
          correta: alt.correta,
          ordem: index,
        })),
      });
    }

    // Fetch updated questao with alternativas
    const updatedQuestao = await db.questao.findUnique({
      where: { id },
      include: {
        alternativas: {
          orderBy: { ordem: "asc" },
        },
      },
    });

    return NextResponse.json(updatedQuestao);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating questao:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar questão" },
      { status: 500 }
    );
  }
}

// DELETE /api/questoes/[id] - Excluir questão
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const existingQuestao = await db.questao.findUnique({
      where: { id },
      include: {
        simulado: {
          select: { docenteId: true },
        },
        provas: true,
      },
    });

    if (!existingQuestao) {
      return NextResponse.json(
        { error: "Questão não encontrada" },
        { status: 404 }
      );
    }

    if (
      existingQuestao.simulado.docenteId !== session.user.id &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Check if questao is in any prova
    if (existingQuestao.provas.length > 0) {
      // Soft delete - just deactivate
      await db.questao.update({
        where: { id },
        data: { ativo: false },
      });

      return NextResponse.json({
        message: "Questão desativada (está vinculada a provas)",
      });
    }

    // Hard delete if not in any prova
    await db.questao.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Questão excluída com sucesso" });
  } catch (error) {
    console.error("Error deleting questao:", error);
    return NextResponse.json(
      { error: "Erro ao excluir questão" },
      { status: 500 }
    );
  }
}
