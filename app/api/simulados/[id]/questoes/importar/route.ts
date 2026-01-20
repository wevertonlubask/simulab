import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { importarQuestoesSchema } from "@/lib/validations/questao";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/simulados/[id]/questoes/importar - Importar questões via JSON
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
      select: { docenteId: true },
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
    const validatedData = importarQuestoesSchema.parse(body);

    // Validate each question
    const errors: { index: number; error: string }[] = [];
    validatedData.questoes.forEach((q, index) => {
      const corretas = q.alternativas.filter((a) => a.correta);

      if (q.tipo === "MULTIPLA_ESCOLHA_UNICA" && corretas.length !== 1) {
        errors.push({
          index,
          error: `Questão ${index + 1}: Múltipla escolha única deve ter exatamente 1 correta`,
        });
      }

      if (q.tipo === "MULTIPLA_ESCOLHA_MULTIPLA" && corretas.length < 1) {
        errors.push({
          index,
          error: `Questão ${index + 1}: Múltipla escolha múltipla deve ter ao menos 1 correta`,
        });
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Erros de validação", details: errors },
        { status: 400 }
      );
    }

    // Buscar questões existentes no simulado (com alternativas para comparação completa)
    const questoesExistentes = await db.questao.findMany({
      where: { simuladoId },
      include: { alternativas: true },
    });

    // Criar mapa de questões existentes por enunciado normalizado
    const mapaQuestoesExistentes = new Map(
      questoesExistentes.map((q) => [
        q.enunciado.toLowerCase().trim().replace(/\s+/g, " "),
        q,
      ])
    );

    // Função para verificar se uma questão precisa ser atualizada
    const precisaAtualizar = (
      existente: typeof questoesExistentes[0],
      nova: typeof validatedData.questoes[0]
    ) => {
      // Verificar mudanças em campos básicos
      if (existente.dificuldade !== nova.dificuldade) return true;
      if (existente.tipo !== nova.tipo) return true;
      if (existente.explicacao !== nova.explicacao) return true;

      // Verificar mudanças em tags
      const tagsExistentes = existente.tags.sort().join(",");
      const tagsNovas = (nova.tags || []).sort().join(",");
      if (tagsExistentes !== tagsNovas) return true;

      // Verificar mudanças em alternativas
      if (existente.alternativas.length !== nova.alternativas.length) return true;

      // Comparar alternativas (ordenadas por texto para comparação consistente)
      const altExistentes = [...existente.alternativas].sort((a, b) => a.texto.localeCompare(b.texto));
      const altNovas = [...nova.alternativas].sort((a, b) => a.texto.localeCompare(b.texto));

      for (let i = 0; i < altExistentes.length; i++) {
        if (altExistentes[i].texto !== altNovas[i].texto) return true;
        if (altExistentes[i].correta !== altNovas[i].correta) return true;
      }

      return false;
    };

    // Separar questões em: novas, para atualizar, e sem alterações
    const questoesNovas: typeof validatedData.questoes = [];
    const questoesParaAtualizar: { existente: typeof questoesExistentes[0]; nova: typeof validatedData.questoes[0] }[] = [];
    let questoesSemAlteracao = 0;

    for (const q of validatedData.questoes) {
      const enunciadoNormalizado = q.enunciado.toLowerCase().trim().replace(/\s+/g, " ");
      const existente = mapaQuestoesExistentes.get(enunciadoNormalizado);

      if (!existente) {
        questoesNovas.push(q);
      } else if (precisaAtualizar(existente, q)) {
        questoesParaAtualizar.push({ existente, nova: q });
      } else {
        questoesSemAlteracao++;
      }
    }

    // Get max ordem para novas questões
    const maxOrdem = await db.questao.aggregate({
      where: { simuladoId },
      _max: { ordem: true },
    });

    let currentOrdem = (maxOrdem._max.ordem || 0) + 1;

    // Executar todas as operações em uma transação
    const resultado = await db.$transaction(async (tx) => {
      // 1. Criar questões novas
      const criadas = [];
      for (const q of questoesNovas) {
        const ordem = currentOrdem++;
        const criada = await tx.questao.create({
          data: {
            simuladoId,
            tipo: q.tipo,
            enunciado: q.enunciado,
            dificuldade: q.dificuldade,
            tags: q.tags || [],
            explicacao: q.explicacao,
            ordem,
            alternativas: {
              create: q.alternativas.map((alt, index) => ({
                texto: alt.texto,
                correta: alt.correta,
                ordem: index,
              })),
            },
          },
          include: { alternativas: true },
        });
        criadas.push(criada);
      }

      // 2. Atualizar questões existentes que tiveram mudanças
      const atualizadas = [];
      for (const { existente, nova } of questoesParaAtualizar) {
        // Deletar alternativas antigas
        await tx.alternativa.deleteMany({
          where: { questaoId: existente.id },
        });

        // Atualizar questão e criar novas alternativas
        const atualizada = await tx.questao.update({
          where: { id: existente.id },
          data: {
            tipo: nova.tipo,
            dificuldade: nova.dificuldade,
            tags: nova.tags || [],
            explicacao: nova.explicacao,
            alternativas: {
              create: nova.alternativas.map((alt, index) => ({
                texto: alt.texto,
                correta: alt.correta,
                ordem: index,
              })),
            },
          },
          include: { alternativas: true },
        });
        atualizadas.push(atualizada);
      }

      return { criadas, atualizadas };
    });

    // Montar mensagem de resposta
    const partes: string[] = [];
    if (resultado.criadas.length > 0) {
      partes.push(`${resultado.criadas.length} importada(s)`);
    }
    if (resultado.atualizadas.length > 0) {
      partes.push(`${resultado.atualizadas.length} atualizada(s)`);
    }
    if (questoesSemAlteracao > 0) {
      partes.push(`${questoesSemAlteracao} sem alterações`);
    }

    const message = partes.length > 0
      ? `Questões processadas: ${partes.join(", ")}`
      : "Nenhuma questão para processar";

    return NextResponse.json(
      {
        message,
        importadas: resultado.criadas.length,
        atualizadas: resultado.atualizadas.length,
        semAlteracao: questoesSemAlteracao,
        questoes: [...resultado.criadas, ...resultado.atualizadas],
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "JSON inválido", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error importing questoes:", error);
    return NextResponse.json(
      { error: "Erro ao importar questões" },
      { status: 500 }
    );
  }
}
