import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { exchangeCodeForTokens } from "@/lib/integrations/google-classroom";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Erro de autenticação Google:", error);
      return NextResponse.redirect(
        new URL("/docente/configuracoes?error=google_auth_failed", request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/docente/configuracoes?error=no_code", request.url)
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(
        new URL("/docente/configuracoes?error=not_configured", request.url)
      );
    }

    // Trocar código por tokens
    const tokens = await exchangeCodeForTokens(code, {
      clientId,
      clientSecret,
      redirectUri,
    });

    // Salvar tokens na conta do usuário (usando metadata ou campo específico)
    // Por simplicidade, salvamos como JSON em um campo que pode ser adicionado ao schema
    // Em produção, os tokens devem ser criptografados

    // Por enquanto, apenas confirmamos sucesso
    // TODO: Adicionar campo googleClassroomTokens ao schema do User

    return NextResponse.redirect(
      new URL("/docente/configuracoes?success=google_connected", request.url)
    );
  } catch (error) {
    console.error("Erro no callback do Google:", error);
    return NextResponse.redirect(
      new URL("/docente/configuracoes?error=callback_failed", request.url)
    );
  }
}
