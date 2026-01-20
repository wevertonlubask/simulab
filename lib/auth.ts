import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

// Custom error for API authentication
export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

// Para uso em Server Components (usa redirect)
export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === "DOCENTE" || user.role === "SUPERADMIN") {
      redirect("/docente/dashboard");
    } else {
      redirect("/aluno/dashboard");
    }
  }

  return user;
}

// Para uso em Route Handlers/APIs (lança erro que pode ser capturado)
export async function requireRoleApi(allowedRoles: Role[]) {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthError("Não autorizado", 401);
  }

  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("Acesso negado", 403);
  }

  return user;
}

export function getRedirectUrl(role: Role): string {
  switch (role) {
    case "SUPERADMIN":
    case "DOCENTE":
      return "/docente/dashboard";
    case "ALUNO":
      return "/aluno/dashboard";
    default:
      return "/login";
  }
}
