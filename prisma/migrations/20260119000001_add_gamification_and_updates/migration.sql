-- Migration: add_gamification_and_updates
-- Description: Adds gamification system and updates schema to match current state

-- =============================================
-- STEP 1: Update StatusTentativa enum
-- =============================================

-- Add new value SUBMETIDA if not exists
ALTER TYPE "StatusTentativa" ADD VALUE IF NOT EXISTS 'SUBMETIDA';

-- =============================================
-- STEP 2: Add missing columns to Turma
-- =============================================

ALTER TABLE "Turma" ADD COLUMN IF NOT EXISTS "docenteId" TEXT;
ALTER TABLE "Turma" ADD COLUMN IF NOT EXISTS "ativa" BOOLEAN DEFAULT true;

-- =============================================
-- STEP 3: Add missing columns to TurmaAluno
-- =============================================

ALTER TABLE "TurmaAluno" ADD COLUMN IF NOT EXISTS "dataEntrada" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- =============================================
-- STEP 4: Add missing columns to Tentativa
-- =============================================

ALTER TABLE "Tentativa" ADD COLUMN IF NOT EXISTS "numero" INTEGER DEFAULT 1;
ALTER TABLE "Tentativa" ADD COLUMN IF NOT EXISTS "tempoGasto" INTEGER;
ALTER TABLE "Tentativa" ADD COLUMN IF NOT EXISTS "totalAcertos" INTEGER;
ALTER TABLE "Tentativa" ADD COLUMN IF NOT EXISTS "totalQuestoes" INTEGER DEFAULT 0;

-- =============================================
-- STEP 5: Add missing columns to Resposta
-- =============================================

ALTER TABLE "Resposta" ADD COLUMN IF NOT EXISTS "provaQuestaoId" TEXT;
ALTER TABLE "Resposta" ADD COLUMN IF NOT EXISTS "marcadaRevisao" BOOLEAN DEFAULT false;
ALTER TABLE "Resposta" ADD COLUMN IF NOT EXISTS "feedbackDocente" TEXT;
ALTER TABLE "Resposta" ADD COLUMN IF NOT EXISTS "feedbackData" TIMESTAMP(3);
ALTER TABLE "Resposta" ADD COLUMN IF NOT EXISTS "feedbackVisto" BOOLEAN DEFAULT false;
ALTER TABLE "Resposta" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- =============================================
-- STEP 6: Add missing columns to Prova
-- =============================================

-- Make tentativasMax nullable and set default
ALTER TABLE "Prova" ALTER COLUMN "tentativasMax" DROP NOT NULL;
ALTER TABLE "Prova" ALTER COLUMN "tentativasMax" DROP DEFAULT;
ALTER TABLE "Prova" ALTER COLUMN "intervaloTentativas" SET DEFAULT 0;

-- =============================================
-- STEP 7: Create TipoNotificacao enum
-- =============================================

DO $$ BEGIN
    CREATE TYPE "TipoNotificacao" AS ENUM ('NOVA_PROVA', 'PRAZO_PROVA', 'RESULTADO_DISPONIVEL', 'NOVA_TURMA', 'AVISO_DOCENTE', 'SISTEMA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- STEP 8: Create Notificacao table
-- =============================================

CREATE TABLE IF NOT EXISTS "Notificacao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "link" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notificacao_userId_lida_idx" ON "Notificacao"("userId", "lida");

-- =============================================
-- STEP 9: Create CategoriaConquista enum
-- =============================================

DO $$ BEGIN
    CREATE TYPE "CategoriaConquista" AS ENUM ('PROVAS', 'NOTAS', 'STREAKS', 'ESPECIAIS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- STEP 10: Create UserGamification table
-- =============================================

CREATE TABLE IF NOT EXISTS "UserGamification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "maiorStreak" INTEGER NOT NULL DEFAULT 0,
    "ultimaAtividade" TIMESTAMP(3),
    "aprovacoesSeguidas" INTEGER NOT NULL DEFAULT 0,
    "acertosSeguidos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGamification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserGamification_userId_key" ON "UserGamification"("userId");

-- =============================================
-- STEP 11: Create Conquista table
-- =============================================

CREATE TABLE IF NOT EXISTS "Conquista" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "categoria" "CategoriaConquista" NOT NULL,
    "condicao" JSONB NOT NULL,
    "xpBonus" INTEGER NOT NULL DEFAULT 0,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Conquista_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Conquista_codigo_key" ON "Conquista"("codigo");

-- =============================================
-- STEP 12: Create UserConquista table
-- =============================================

CREATE TABLE IF NOT EXISTS "UserConquista" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conquistaId" TEXT NOT NULL,
    "desbloqueadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserConquista_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserConquista_userId_conquistaId_key" ON "UserConquista"("userId", "conquistaId");
CREATE INDEX IF NOT EXISTS "UserConquista_userId_idx" ON "UserConquista"("userId");

-- =============================================
-- STEP 13: Create Certificado table
-- =============================================

CREATE TABLE IF NOT EXISTS "Certificado" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "tentativaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "notaMinima" DOUBLE PRECISION NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataValidade" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificado_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Certificado_codigo_key" ON "Certificado"("codigo");
CREATE UNIQUE INDEX IF NOT EXISTS "Certificado_tentativaId_key" ON "Certificado"("tentativaId");
CREATE INDEX IF NOT EXISTS "Certificado_alunoId_idx" ON "Certificado"("alunoId");
CREATE INDEX IF NOT EXISTS "Certificado_codigo_idx" ON "Certificado"("codigo");

-- =============================================
-- STEP 14: Add Foreign Keys
-- =============================================

-- Turma -> User (docente)
ALTER TABLE "Turma" DROP CONSTRAINT IF EXISTS "Turma_docenteId_fkey";
DO $$ BEGIN
    ALTER TABLE "Turma" ADD CONSTRAINT "Turma_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- TurmaAluno -> User (aluno)
ALTER TABLE "TurmaAluno" DROP CONSTRAINT IF EXISTS "TurmaAluno_alunoId_fkey";
DO $$ BEGIN
    ALTER TABLE "TurmaAluno" ADD CONSTRAINT "TurmaAluno_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tentativa -> User (aluno)
ALTER TABLE "Tentativa" DROP CONSTRAINT IF EXISTS "Tentativa_alunoId_fkey";
DO $$ BEGIN
    ALTER TABLE "Tentativa" ADD CONSTRAINT "Tentativa_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notificacao -> User
DO $$ BEGIN
    ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- UserGamification -> User
DO $$ BEGIN
    ALTER TABLE "UserGamification" ADD CONSTRAINT "UserGamification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- UserConquista -> User
DO $$ BEGIN
    ALTER TABLE "UserConquista" ADD CONSTRAINT "UserConquista_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- UserConquista -> Conquista
DO $$ BEGIN
    ALTER TABLE "UserConquista" ADD CONSTRAINT "UserConquista_conquistaId_fkey" FOREIGN KEY ("conquistaId") REFERENCES "Conquista"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Certificado -> User (aluno)
DO $$ BEGIN
    ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Certificado -> Tentativa
DO $$ BEGIN
    ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_tentativaId_fkey" FOREIGN KEY ("tentativaId") REFERENCES "Tentativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- STEP 15: Add unique constraint on Tentativa
-- =============================================

CREATE UNIQUE INDEX IF NOT EXISTS "Tentativa_provaId_alunoId_numero_key" ON "Tentativa"("provaId", "alunoId", "numero");
