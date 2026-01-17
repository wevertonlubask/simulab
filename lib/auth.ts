import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

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
