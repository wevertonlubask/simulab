import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ALUNO", "DOCENTE", "SUPERADMIN"]);
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "20");
    const onlyUnread = searchParams.get("unread") === "true";

    const notificacoes = await db.notificacao.findMany({
      where: {
        userId: user.id,
        ...(onlyUnread ? { lida: false } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    const totalNaoLidas = await db.notificacao.count({
      where: {
        userId: user.id,
        lida: false,
      },
    });

    return NextResponse.json({
      notificacoes,
      totalNaoLidas,
    });
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ALUNO", "DOCENTE", "SUPERADMIN"]);
    const body = await request.json();

    const { notificacaoId, marcarTodas } = body;

    if (marcarTodas) {
      await db.notificacao.updateMany({
        where: {
          userId: user.id,
          lida: false,
        },
        data: {
          lida: true,
        },
      });

      return NextResponse.json({ message: "Todas as notificações foram marcadas como lidas" });
    }

    if (notificacaoId) {
      const notificacao = await db.notificacao.findFirst({
        where: {
          id: notificacaoId,
          userId: user.id,
        },
      });

      if (!notificacao) {
        return NextResponse.json(
          { error: "Notificação não encontrada" },
          { status: 404 }
        );
      }

      await db.notificacao.update({
        where: { id: notificacaoId },
        data: { lida: true },
      });

      return NextResponse.json({ message: "Notificação marcada como lida" });
    }

    return NextResponse.json(
      { error: "Parâmetros inválidos" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao atualizar notificação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ALUNO", "DOCENTE", "SUPERADMIN"]);
    const { searchParams } = new URL(request.url);

    const notificacaoId = searchParams.get("id");
    const apenasLidas = searchParams.get("apenasLidas") === "true";

    if (apenasLidas) {
      await db.notificacao.deleteMany({
        where: {
          userId: user.id,
          lida: true,
        },
      });

      return NextResponse.json({ message: "Notificações lidas foram excluídas" });
    }

    if (notificacaoId) {
      const notificacao = await db.notificacao.findFirst({
        where: {
          id: notificacaoId,
          userId: user.id,
        },
      });

      if (!notificacao) {
        return NextResponse.json(
          { error: "Notificação não encontrada" },
          { status: 404 }
        );
      }

      await db.notificacao.delete({
        where: { id: notificacaoId },
      });

      return NextResponse.json({ message: "Notificação excluída" });
    }

    return NextResponse.json(
      { error: "Parâmetros inválidos" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao excluir notificação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
