import { NextRequest, NextResponse } from "next/server";
import { requireRoleApi, AuthError } from "@/lib/auth";
import { setConfig, getLogoConfigs, deleteConfig, CONFIG_KEYS, type ConfigKey } from "@/lib/system-config";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "logos");
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// GET /api/admin/config/logo - Buscar logos atuais
export async function GET() {
  try {
    await requireRoleApi(["SUPERADMIN", "DOCENTE", "ALUNO"]);

    const logos = await getLogoConfigs();

    return NextResponse.json(logos);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erro ao buscar logos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar logos" },
      { status: 500 }
    );
  }
}

// POST /api/admin/config/logo - Upload de logo
export async function POST(request: NextRequest) {
  console.log("[Logo Upload] Iniciando upload...");

  try {
    const user = await requireRoleApi(["SUPERADMIN"]);
    console.log("[Logo Upload] Usuário autenticado:", user.email);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    console.log("[Logo Upload] Arquivo recebido:", file?.name, "Tipo:", type);

    if (!file) {
      console.log("[Logo Upload] Erro: Arquivo não enviado");
      return NextResponse.json(
        { error: "Arquivo não enviado" },
        { status: 400 }
      );
    }

    if (!type || !["light", "dark", "favicon"].includes(type)) {
      console.log("[Logo Upload] Erro: Tipo inválido:", type);
      return NextResponse.json(
        { error: "Tipo de logo inválido. Use: light, dark ou favicon" },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log("[Logo Upload] Erro: Tipo de arquivo não permitido:", file.type);
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido: ${file.type}. Use PNG, JPG, SVG, GIF ou WebP` },
        { status: 400 }
      );
    }

    // Validar tamanho
    if (file.size > MAX_SIZE) {
      console.log("[Logo Upload] Erro: Arquivo muito grande:", file.size);
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 10MB" },
        { status: 400 }
      );
    }

    // Criar diretório se não existir
    if (!existsSync(UPLOAD_DIR)) {
      console.log("[Logo Upload] Criando diretório:", UPLOAD_DIR);
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Obter buffer do arquivo
    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    console.log("[Logo Upload] Buffer criado, tamanho:", inputBuffer.length);

    // Determinar extensão de saída - manter PNG para qualidade lossless
    const outputExt = "png";
    const filename = `logo_${type}_${Date.now()}.${outputExt}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    console.log("[Logo Upload] Processando imagem com sharp...");

    // Processar imagem mantendo qualidade máxima
    if (file.type === "image/svg+xml") {
      // Para SVG, converter para PNG com alta densidade para manter qualidade
      const processedBuffer = await sharp(inputBuffer, { density: 300 })
        .png({
          quality: 100,
          compressionLevel: 0, // Sem compressão para máxima qualidade
        })
        .toBuffer();

      await writeFile(filepath, processedBuffer);
      console.log("[Logo Upload] SVG convertido para PNG de alta qualidade");
    } else if (file.type === "image/png") {
      // PNG: manter original sem reprocessar para preservar qualidade
      await writeFile(filepath, inputBuffer);
      console.log("[Logo Upload] PNG salvo sem reprocessamento");
    } else {
      // Para outros formatos (JPEG, WebP, GIF), converter para PNG lossless
      const processedBuffer = await sharp(inputBuffer)
        .png({
          quality: 100,
          compressionLevel: 0,
        })
        .toBuffer();

      await writeFile(filepath, processedBuffer);
      console.log("[Logo Upload] Imagem convertida para PNG de alta qualidade");
    }

    // URL pública
    const publicUrl = `/uploads/logos/${filename}`;

    // Mapear tipo para chave de configuração
    const configKey: ConfigKey =
      type === "light" ? CONFIG_KEYS.LOGO_LIGHT :
      type === "dark" ? CONFIG_KEYS.LOGO_DARK :
      CONFIG_KEYS.LOGO_FAVICON;

    // Buscar logo anterior para remover
    const currentLogos = await getLogoConfigs();
    const oldUrl = currentLogos[configKey];

    if (oldUrl) {
      const oldPath = path.join(process.cwd(), "public", oldUrl);
      if (existsSync(oldPath)) {
        await unlink(oldPath).catch(() => {});
        console.log("[Logo Upload] Logo anterior removida:", oldPath);
      }
    }

    // Salvar URL no banco
    await setConfig(configKey, publicUrl);
    console.log("[Logo Upload] Configuração salva no banco:", configKey, publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      type,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      console.log("[Logo Upload] Erro de autenticação:", error.message);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Logo Upload] Erro ao fazer upload de logo:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload de logo" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/config/logo - Remover logo
export async function DELETE(request: NextRequest) {
  try {
    await requireRoleApi(["SUPERADMIN"]);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type || !["light", "dark", "favicon"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo de logo inválido" },
        { status: 400 }
      );
    }

    // Mapear tipo para chave de configuração
    const configKey: ConfigKey =
      type === "light" ? CONFIG_KEYS.LOGO_LIGHT :
      type === "dark" ? CONFIG_KEYS.LOGO_DARK :
      CONFIG_KEYS.LOGO_FAVICON;

    // Buscar URL atual para remover o arquivo
    const logos = await getLogoConfigs();
    const currentUrl = logos[configKey];

    if (currentUrl) {
      // Remover arquivo físico
      const filepath = path.join(process.cwd(), "public", currentUrl);
      if (existsSync(filepath)) {
        await unlink(filepath).catch(() => {});
        console.log("[Logo Delete] Arquivo removido:", filepath);
      }
    }

    // Remover configuração
    await deleteConfig(configKey);
    console.log("[Logo Delete] Configuração removida:", configKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Logo Delete] Erro ao remover logo:", error);
    return NextResponse.json(
      { error: "Erro ao remover logo" },
      { status: 500 }
    );
  }
}
