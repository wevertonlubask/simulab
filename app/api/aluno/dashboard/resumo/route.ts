"use server";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ALUNO") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const alunoId = session.user.id;

    // Get all completed tentativas for this student
    const tentativas = await db.tentativa.findMany({
      where: {
        alunoId,
        status: "SUBMETIDA",
      },
      include: {
        prova: {
          select: {
            notaMinima: true,
          },
        },
      },
      orderBy: { dataFim: "desc" },
    });

    // Calculate metrics
    const totalProvas = tentativas.length;
    const notaMedia = totalProvas > 0
      ? Math.round(tentativas.reduce((acc, t) => acc + (t.nota || 0), 0) / totalProvas)
      : 0;
    const aprovados = tentativas.filter(t => (t.nota || 0) >= t.prova.notaMinima).length;
    const taxaAprovacao = totalProvas > 0
      ? Math.round((aprovados / totalProvas) * 100)
      : 0;

    // Calculate streak (consecutive days with at least one tentativa)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tentativasByDate = new Map<string, boolean>();
    tentativas.forEach(t => {
      if (t.dataFim) {
        const date = new Date(t.dataFim);
        date.setHours(0, 0, 0, 0);
        tentativasByDate.set(date.toISOString().split('T')[0], true);
      }
    });

    let streak = 0;
    const checkDate = new Date(today);

    // Start from today or yesterday if no tentativa today
    if (!tentativasByDate.has(checkDate.toISOString().split('T')[0])) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (tentativasByDate.has(checkDate.toISOString().split('T')[0])) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate variation compared to last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const tentativasThisMonth = tentativas.filter(t =>
      t.dataFim && new Date(t.dataFim) >= oneMonthAgo
    );
    const tentativasLastMonth = tentativas.filter(t => {
      if (!t.dataFim) return false;
      const date = new Date(t.dataFim);
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      return date >= twoMonthsAgo && date < oneMonthAgo;
    });

    const notaMediaThisMonth = tentativasThisMonth.length > 0
      ? tentativasThisMonth.reduce((acc, t) => acc + (t.nota || 0), 0) / tentativasThisMonth.length
      : 0;
    const notaMediaLastMonth = tentativasLastMonth.length > 0
      ? tentativasLastMonth.reduce((acc, t) => acc + (t.nota || 0), 0) / tentativasLastMonth.length
      : 0;

    const variacao = notaMediaLastMonth > 0
      ? Math.round(((notaMediaThisMonth - notaMediaLastMonth) / notaMediaLastMonth) * 100)
      : 0;

    return NextResponse.json({
      notaMedia,
      totalProvas,
      taxaAprovacao,
      streak,
      variacao,
    });
  } catch (error) {
    console.error("Erro ao buscar resumo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
