import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireRole(["DOCENTE", "SUPERADMIN"]);

    const simulados = await db.simulado.findMany({
      where: user.role === "SUPERADMIN" ? {} : { docenteId: user.id },
      select: {
        id: true,
        nome: true,
        categoria: true,
        status: true,
        _count: {
          select: {
            questoes: true,
            provas: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json({ simulados });
  } catch (error) {
    console.error("Erro ao buscar simulados:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
