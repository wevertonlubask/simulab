import { NextRequest, NextResponse } from "next/server";
import { requireRoleApi, AuthError } from "@/lib/auth";
import {
  getAllConfigs,
  setConfig,
  setConfigs,
  CONFIG_KEYS,
  type ConfigKey,
} from "@/lib/system-config";

// GET /api/admin/config - Buscar todas as configurações
export async function GET() {
  try {
    await requireRoleApi(["SUPERADMIN", "DOCENTE"]);

    const configs = await getAllConfigs();

    return NextResponse.json(configs);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/config - Atualizar configurações
export async function PUT(request: NextRequest) {
  try {
    await requireRoleApi(["SUPERADMIN"]);

    const body = await request.json();
    const { configs } = body as {
      configs: Array<{ key: string; value: string; type?: string }>;
    };

    if (!configs || !Array.isArray(configs)) {
      return NextResponse.json(
        { error: "Configurações inválidas" },
        { status: 400 }
      );
    }

    // Validar chaves
    const validKeys = Object.values(CONFIG_KEYS);
    const validConfigs = configs.filter((c) =>
      validKeys.includes(c.key as ConfigKey)
    );

    if (validConfigs.length > 0) {
      await setConfigs(
        validConfigs.map((c) => ({
          key: c.key as ConfigKey,
          value: c.value,
          type: c.type,
        }))
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar configurações" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/config - Atualizar uma configuração específica
export async function PATCH(request: NextRequest) {
  try {
    await requireRoleApi(["SUPERADMIN"]);

    const body = await request.json();
    const { key, value, type } = body as {
      key: string;
      value: string;
      type?: string;
    };

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Chave e valor são obrigatórios" },
        { status: 400 }
      );
    }

    const validKeys = Object.values(CONFIG_KEYS);
    if (!validKeys.includes(key as ConfigKey)) {
      return NextResponse.json(
        { error: "Chave de configuração inválida" },
        { status: 400 }
      );
    }

    await setConfig(key as ConfigKey, value, type);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erro ao atualizar configuração:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar configuração" },
      { status: 500 }
    );
  }
}
