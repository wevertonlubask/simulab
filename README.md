# Simulab - Plataforma de Simulados

> Sua evolução em cada questão

Plataforma PWA para gestão de simulados de certificações profissionais.

## Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco de Dados**: PostgreSQL
- **Autenticação**: NextAuth.js v5
- **PWA**: next-pwa + Workbox

## Requisitos

- Node.js 18+
- PostgreSQL (local ou Supabase/Neon)

## Setup do Projeto

1. **Clone e instale as dependências:**

```bash
cd simulab
npm install
```

2. **Configure as variáveis de ambiente:**

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/simulab"
AUTH_SECRET="gere-uma-chave-secreta-com-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
```

3. **Gere o Prisma Client e execute as migrations:**

```bash
npx prisma generate
npx prisma db push
```

4. **Inicie o servidor de desenvolvimento:**

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
simulab/
├── app/
│   ├── (auth)/           # Páginas de autenticação
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/      # Área logada
│   │   ├── docente/      # Painel do docente
│   │   └── aluno/        # Painel do aluno
│   └── api/              # API Routes
├── components/
│   ├── ui/               # Componentes shadcn/ui
│   ├── layout/           # Sidebar, Header
│   └── pwa/              # Componentes PWA
├── lib/                  # Utilitários
├── hooks/                # Custom hooks
├── types/                # TypeScript types
└── prisma/               # Schema Prisma
```

## Funcionalidades (Sprint 1.1)

- [x] PWA instalável
- [x] Autenticação (login/registro)
- [x] Dark/Light mode
- [x] Layout responsivo com sidebar
- [x] Proteção de rotas por role
- [x] Dashboards (docente/aluno)

## Próximas Sprints

- **Sprint 1.2**: CRUD de Simulados
- **Sprint 1.3**: CRUD de Questões
- **Sprint 1.4**: Geração de Provas

## Ícones PWA

Para o PWA funcionar corretamente, adicione os ícones na pasta `public/icons/`:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

Você pode gerar os ícones a partir de uma imagem base usando ferramentas como:
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [Real Favicon Generator](https://realfavicongenerator.net/)

## Licença

Projeto privado - Todos os direitos reservados.
