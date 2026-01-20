"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Página de registro desativada - usuários só podem ser criados por administradores
export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return null;
}
