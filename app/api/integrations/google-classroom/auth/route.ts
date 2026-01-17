import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/integrations/google-classroom";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["DOCENTE", "SUPERADMIN"]);

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        {
          error: "Integração com Google Classroom não configurada",
          details:
            "Configure as variáveis GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI",
        },
        { status: 503 }
      );
    }

    const authUrl = getGoogleAuthUrl({
      clientId,
      clientSecret,
      redirectUri,
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Erro ao gerar URL de autenticação:", error);
    return NextResponse.json(
      { error: "Erro ao iniciar autenticação" },
      { status: 500 }
    );
  }
}
