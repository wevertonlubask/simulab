import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireRole(["DOCENTE", "SUPERADMIN"]);

    const turmas = await db.turma.findMany({
      where: user.role === "SUPERADMIN" ? {} : { docenteId: user.id },
      select: {
        id: true,
        nome: true,
        codigo: true,
        ativa: true,
        _count: {
          select: {
            alunos: true,
            provas: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json({ turmas });
  } catch (error) {
    console.error("Erro ao buscar turmas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
