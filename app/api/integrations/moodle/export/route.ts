import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { questoesToGIFT } from "@/lib/integrations/moodle";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
    const { searchParams } = new URL(request.url);
    const simuladoId = searchParams.get("simuladoId");

    if (!simuladoId) {
      return NextResponse.json(
        { error: "simuladoId é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar acesso ao simulado
    const simulado = await db.simulado.findUnique({
      where: { id: simuladoId },
      include: {
        questoes: {
          where: { ativo: true },
          include: {
            alternativas: {
              orderBy: { ordem: "asc" },
            },
          },
          orderBy: { ordem: "asc" },
        },
      },
    });

    if (!simulado) {
      return NextResponse.json(
        { error: "Simulado não encontrado" },
        { status: 404 }
      );
    }

    if (user.role !== "SUPERADMIN" && simulado.docenteId !== user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Converter para formato de exportação
    const questoesExport = simulado.questoes.map((q) => ({
      enunciado: q.enunciado,
      tipo: q.tipo,
      dificuldade: q.dificuldade,
      explicacao: q.explicacao,
      alternativas: q.alternativas.map((a) => ({
        texto: a.texto,
        correta: a.correta,
      })),
    }));

    // Gerar GIFT
    const giftContent = questoesToGIFT(questoesExport);

    // Retornar como arquivo para download
    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=utf-8");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${simulado.nome.replace(/[^a-z0-9]/gi, "_")}_moodle.gift"`
    );

    return new NextResponse(giftContent, { headers });
  } catch (error) {
    console.error("Erro ao exportar para Moodle:", error);
    return NextResponse.json(
      { error: "Erro ao exportar questões" },
      { status: 500 }
    );
  }
}
