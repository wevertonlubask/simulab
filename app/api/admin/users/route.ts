import { NextResponse } from "next/server";
import { requireRoleApi, AuthError } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    await requireRoleApi(["SUPERADMIN"]);
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const where = {
      ...(search && {
        OR: [
          { nome: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(role && { role: role as "SUPERADMIN" | "DOCENTE" | "ALUNO" }),
    };

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          avatar: true,
          createdAt: true,
          _count: {
            select: {
              turmasAluno: true,
              turmasDocente: true,
              simulados: true,
              tentativas: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Senha padrão para novos usuários
const DEFAULT_PASSWORD = "Mudar@123";

const createUserSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.union([
    z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    z.string().length(0), // Permite string vazia
  ]).optional(),
  role: z.enum(["SUPERADMIN", "DOCENTE", "ALUNO"]),
});

export async function POST(request: Request) {
  try {
    console.log("[POST /api/admin/users] Iniciando...");

    const currentUser = await requireRoleApi(["SUPERADMIN"]);
    console.log("[POST /api/admin/users] Usuário autenticado:", currentUser.email);

    const body = await request.json();
    console.log("[POST /api/admin/users] Body recebido:", JSON.stringify(body));

    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      console.log("[POST /api/admin/users] Validação falhou:", validation.error.errors);
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    console.log("[POST /api/admin/users] Validação OK, verificando email existente...");

    // Verificar se email já existe
    const existingUser = await db.user.findUnique({
      where: { email: validation.data.email },
    });

    if (existingUser) {
      console.log("[POST /api/admin/users] Email já existe");
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 400 }
      );
    }

    console.log("[POST /api/admin/users] Email disponível, criando usuário...");

    // Criar usuário com senha padrão ou personalizada
    // Tratar string vazia como sem senha (usar padrão)
    const senhaInformada = validation.data.senha && validation.data.senha.trim().length > 0;
    const senhaParaHash = senhaInformada ? validation.data.senha : DEFAULT_PASSWORD;
    const senhaHash = await bcrypt.hash(senhaParaHash, 10);
    const usandoSenhaPadrao = !senhaInformada;

    console.log("[POST /api/admin/users] Senha hashada, usando senha padrão:", usandoSenhaPadrao);

    const user = await db.user.create({
      data: {
        nome: validation.data.nome,
        email: validation.data.email,
        senha: senhaHash,
        role: validation.data.role,
        mustChangePassword: usandoSenhaPadrao,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        createdAt: true,
        mustChangePassword: true,
      },
    });

    console.log("[POST /api/admin/users] Usuário criado com sucesso:", user.id);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      console.log("[POST /api/admin/users] AuthError:", error.message);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/admin/users] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
