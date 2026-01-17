-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'DOCENTE', 'ALUNO');

-- CreateEnum
CREATE TYPE "StatusSimulado" AS ENUM ('ATIVO', 'INATIVO', 'EM_EDICAO');

-- CreateEnum
CREATE TYPE "TipoQuestao" AS ENUM ('MULTIPLA_ESCOLHA_UNICA', 'MULTIPLA_ESCOLHA_MULTIPLA', 'DRAG_DROP', 'ASSOCIACAO', 'ORDENACAO', 'LACUNA', 'HOTSPOT', 'COMANDO');

-- CreateEnum
CREATE TYPE "Dificuldade" AS ENUM ('FACIL', 'MEDIO', 'DIFICIL');

-- CreateEnum
CREATE TYPE "NotaConsiderada" AS ENUM ('MAIOR', 'ULTIMA');

-- CreateEnum
CREATE TYPE "MostrarResultado" AS ENUM ('IMEDIATO', 'DATA', 'NUNCA');

-- CreateEnum
CREATE TYPE "StatusProva" AS ENUM ('RASCUNHO', 'PUBLICADA', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "StatusTentativa" AS ENUM ('EM_ANDAMENTO', 'FINALIZADA', 'ABANDONADA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "senha" TEXT,
    "avatar" TEXT,
    "role" "Role" NOT NULL DEFAULT 'ALUNO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Simulado" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "status" "StatusSimulado" NOT NULL DEFAULT 'EM_EDICAO',
    "imagemUrl" TEXT,
    "docenteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Simulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questao" (
    "id" TEXT NOT NULL,
    "simuladoId" TEXT NOT NULL,
    "tipo" "TipoQuestao" NOT NULL,
    "enunciado" TEXT NOT NULL,
    "imagemUrl" TEXT,
    "explicacao" TEXT,
    "dificuldade" "Dificuldade" NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "tags" TEXT[],
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "configuracao" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Questao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alternativa" (
    "id" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "imagemUrl" TEXT,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Alternativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prova" (
    "id" TEXT NOT NULL,
    "simuladoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tempoLimite" INTEGER,
    "tentativasMax" INTEGER NOT NULL DEFAULT 3,
    "intervaloTentativas" INTEGER NOT NULL DEFAULT 24,
    "notaMinima" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "notaConsiderada" "NotaConsiderada" NOT NULL DEFAULT 'MAIOR',
    "mostrarResultado" "MostrarResultado" NOT NULL DEFAULT 'IMEDIATO',
    "dataResultado" TIMESTAMP(3),
    "embaralharQuestoes" BOOLEAN NOT NULL DEFAULT true,
    "embaralharAlternativas" BOOLEAN NOT NULL DEFAULT true,
    "status" "StatusProva" NOT NULL DEFAULT 'RASCUNHO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prova_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvaQuestao" (
    "id" TEXT NOT NULL,
    "provaId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "ProvaQuestao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turma" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "codigo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurmaProva" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "provaId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TurmaProva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurmaAluno" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TurmaAluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tentativa" (
    "id" TEXT NOT NULL,
    "provaId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "nota" DOUBLE PRECISION,
    "acertos" INTEGER,
    "erros" INTEGER,
    "status" "StatusTentativa" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tentativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resposta" (
    "id" TEXT NOT NULL,
    "tentativaId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "resposta" JSONB NOT NULL,
    "correta" BOOLEAN,
    "pontuacao" DOUBLE PRECISION,
    "tempoResposta" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resposta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Simulado_nome_docenteId_key" ON "Simulado"("nome", "docenteId");

-- CreateIndex
CREATE UNIQUE INDEX "Prova_codigo_key" ON "Prova"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ProvaQuestao_provaId_questaoId_key" ON "ProvaQuestao"("provaId", "questaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Turma_codigo_key" ON "Turma"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "TurmaProva_turmaId_provaId_key" ON "TurmaProva"("turmaId", "provaId");

-- CreateIndex
CREATE UNIQUE INDEX "TurmaAluno_turmaId_alunoId_key" ON "TurmaAluno"("turmaId", "alunoId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulado" ADD CONSTRAINT "Simulado_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questao" ADD CONSTRAINT "Questao_simuladoId_fkey" FOREIGN KEY ("simuladoId") REFERENCES "Simulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternativa" ADD CONSTRAINT "Alternativa_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prova" ADD CONSTRAINT "Prova_simuladoId_fkey" FOREIGN KEY ("simuladoId") REFERENCES "Simulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvaQuestao" ADD CONSTRAINT "ProvaQuestao_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvaQuestao" ADD CONSTRAINT "ProvaQuestao_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaProva" ADD CONSTRAINT "TurmaProva_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaProva" ADD CONSTRAINT "TurmaProva_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaAluno" ADD CONSTRAINT "TurmaAluno_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tentativa" ADD CONSTRAINT "Tentativa_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_tentativaId_fkey" FOREIGN KEY ("tentativaId") REFERENCES "Tentativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
