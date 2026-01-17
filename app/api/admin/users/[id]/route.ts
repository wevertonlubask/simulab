import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["SUPERADMIN"]);
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            turmasAluno: true,
            turmasDocente: true,
            simulados: true,
            tentativas: true,
            notificacoes: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

const updateUserSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  role: z.enum(["SUPERADMIN", "DOCENTE", "ALUNO"]).optional(),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await requireRole(["SUPERADMIN"]);
    const { id } = await params;
    const body = await request.json();

    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Não permitir alterar o próprio role
    if (id === currentUser.id && validation.data.role && validation.data.role !== currentUser.role) {
      return NextResponse.json(
        { error: "Você não pode alterar seu próprio papel" },
        { status: 400 }
      );
    }

    // Verificar se email já está em uso
    if (validation.data.email && validation.data.email !== existingUser.email) {
      const emailInUse = await db.user.findFirst({
        where: {
          email: validation.data.email,
          NOT: { id },
        },
      });

      if (emailInUse) {
        return NextResponse.json(
          { error: "Este email já está em uso" },
          { status: 400 }
        );
      }
    }

    // Preparar dados de atualização
    const updateData: Record<string, unknown> = {};
    if (validation.data.nome) updateData.nome = validation.data.nome;
    if (validation.data.email) updateData.email = validation.data.email;
    if (validation.data.role) updateData.role = validation.data.role;
    if (validation.data.senha) {
      updateData.senha = await bcrypt.hash(validation.data.senha, 10);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await requireRole(["SUPERADMIN"]);
    const { id } = await params;

    // Não permitir excluir a si mesmo
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: "Você não pode excluir sua própria conta" },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Excluir usuário (cascata vai deletar dados relacionados)
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
