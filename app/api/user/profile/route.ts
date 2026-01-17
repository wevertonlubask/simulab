import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateProfileSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  avatar: z.string().url("URL inválida").nullable().optional(),
});

const updatePasswordSchema = z.object({
  senhaAtual: z.string().min(1, "Senha atual é obrigatória"),
  novaSenha: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmarSenha: z.string().min(1, "Confirmação é obrigatória"),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        nome: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            tentativas: true,
            turmasAluno: true,
            turmasDocente: true,
            simulados: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao buscar perfil" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Verificar se é atualização de senha
    if (body.senhaAtual) {
      const validation = updatePasswordSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0].message },
          { status: 400 }
        );
      }

      // Buscar usuário com senha
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { senha: true },
      });

      if (!user?.senha) {
        return NextResponse.json(
          { error: "Usuário não possui senha cadastrada" },
          { status: 400 }
        );
      }

      // Verificar senha atual
      const senhaValida = await bcrypt.compare(
        validation.data.senhaAtual,
        user.senha
      );

      if (!senhaValida) {
        return NextResponse.json(
          { error: "Senha atual incorreta" },
          { status: 400 }
        );
      }

      // Atualizar senha
      const senhaHash = await bcrypt.hash(validation.data.novaSenha, 10);
      await db.user.update({
        where: { id: session.user.id },
        data: { senha: senhaHash },
      });

      return NextResponse.json({ message: "Senha atualizada com sucesso" });
    }

    // Atualização de perfil
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verificar se email já está em uso
    if (validation.data.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email: validation.data.email,
          NOT: { id: session.user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Este email já está em uso" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(validation.data.nome && { nome: validation.data.nome }),
        ...(validation.data.email && { email: validation.data.email }),
        ...(validation.data.avatar !== undefined && { avatar: validation.data.avatar }),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        avatar: true,
        role: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
