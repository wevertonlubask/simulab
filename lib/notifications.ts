import { db } from "@/lib/db";
import { TipoNotificacao, Prisma } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  link?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createNotification(params: CreateNotificationParams) {
  return db.notificacao.create({
    data: {
      userId: params.userId,
      tipo: params.tipo,
      titulo: params.titulo,
      mensagem: params.mensagem,
      link: params.link,
      metadata: params.metadata,
    },
  });
}

export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
) {
  return db.notificacao.createMany({
    data: userIds.map((userId) => ({
      userId,
      tipo: params.tipo,
      titulo: params.titulo,
      mensagem: params.mensagem,
      link: params.link,
      metadata: params.metadata,
    })),
  });
}

export async function notifyNewProva(
  turmaId: string,
  prova: { id: string; nome: string; codigo: string }
) {
  const alunosTurma = await db.turmaAluno.findMany({
    where: { turmaId },
    select: { alunoId: true },
  });

  const userIds = alunosTurma.map((at) => at.alunoId);

  if (userIds.length > 0) {
    await createBulkNotifications(userIds, {
      tipo: "NOVA_PROVA",
      titulo: "Nova prova disponível",
      mensagem: `A prova "${prova.nome}" (${prova.codigo}) foi disponibilizada para sua turma.`,
      link: `/aluno/provas/${prova.id}`,
      metadata: { provaId: prova.id, provaCodigo: prova.codigo },
    });
  }
}

export async function notifyPrazoProva(
  turmaId: string,
  prova: { id: string; nome: string },
  dataFim: Date
) {
  const alunosTurma = await db.turmaAluno.findMany({
    where: { turmaId },
    select: { alunoId: true },
  });

  const userIds = alunosTurma.map((at) => at.alunoId);

  if (userIds.length > 0) {
    const dataFormatada = dataFim.toLocaleDateString("pt-BR");
    await createBulkNotifications(userIds, {
      tipo: "PRAZO_PROVA",
      titulo: "Prazo de prova se aproximando",
      mensagem: `A prova "${prova.nome}" encerra em ${dataFormatada}. Não esqueça de realizá-la!`,
      link: `/aluno/provas/${prova.id}`,
      metadata: { provaId: prova.id, dataFim: dataFim.toISOString() },
    });
  }
}

export async function notifyResultadoDisponivel(
  alunoId: string,
  prova: { id: string; nome: string },
  tentativaId: string
) {
  await createNotification({
    userId: alunoId,
    tipo: "RESULTADO_DISPONIVEL",
    titulo: "Resultado disponível",
    mensagem: `O resultado da sua prova "${prova.nome}" está disponível para visualização.`,
    link: `/aluno/provas/${prova.id}/resultado/${tentativaId}`,
    metadata: { provaId: prova.id, tentativaId },
  });
}

export async function notifyNovaTurma(alunoId: string, turma: { id: string; nome: string }) {
  await createNotification({
    userId: alunoId,
    tipo: "NOVA_TURMA",
    titulo: "Você entrou em uma turma",
    mensagem: `Você foi adicionado à turma "${turma.nome}". Confira as provas disponíveis!`,
    link: `/aluno/turmas`,
    metadata: { turmaId: turma.id },
  });
}

export async function notifyAvisoDocente(
  turmaId: string,
  titulo: string,
  mensagem: string
) {
  const alunosTurma = await db.turmaAluno.findMany({
    where: { turmaId },
    select: { alunoId: true },
  });

  const userIds = alunosTurma.map((at) => at.alunoId);

  if (userIds.length > 0) {
    await createBulkNotifications(userIds, {
      tipo: "AVISO_DOCENTE",
      titulo,
      mensagem,
      metadata: { turmaId },
    });
  }
}
