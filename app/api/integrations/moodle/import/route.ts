import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseGIFT } from "@/lib/integrations/moodle";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["DOCENTE", "SUPERADMIN"]);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const simuladoId = formData.get("simuladoId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo GIFT é obrigatório" },
        { status: 400 }
      );
    }

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
        _count: { select: { questoes: true } },
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

    // Ler conteúdo do arquivo
    const giftContent = await file.text();

    // Parsear GIFT
    const questoesImport = parseGIFT(giftContent);

    if (questoesImport.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma questão válida encontrada no arquivo GIFT" },
        { status: 400 }
      );
    }

    // Inserir questões no banco
    const ordemInicial = simulado._count.questoes;
    let importadas = 0;
    const erros: string[] = [];

    for (let i = 0; i < questoesImport.length; i++) {
      const q = questoesImport[i];

      try {
        await db.questao.create({
          data: {
            simuladoId,
            tipo: q.tipo,
            enunciado: q.enunciado,
            explicacao: q.explicacao,
            dificuldade: q.dificuldade,
            ordem: ordemInicial + i,
            alternativas: {
              create: q.alternativas.map((a) => ({
                texto: a.texto,
                correta: a.correta,
                ordem: a.ordem,
              })),
            },
          },
        });
        importadas++;
      } catch (err) {
        erros.push(`Questão ${i + 1}: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      }
    }

    return NextResponse.json({
      message: `${importadas} questão(ões) importada(s) com sucesso`,
      totalEncontradas: questoesImport.length,
      importadas,
      erros: erros.length > 0 ? erros : undefined,
    });
  } catch (error) {
    console.error("Erro ao importar do Moodle:", error);
    return NextResponse.json(
      { error: "Erro ao importar questões" },
      { status: 500 }
    );
  }
}
