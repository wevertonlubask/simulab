import { db } from "@/lib/db";

// Chaves de configuração do sistema
export const CONFIG_KEYS = {
  LOGO_LIGHT: "logo_light", // Logo para tema claro
  LOGO_DARK: "logo_dark", // Logo para tema escuro
  LOGO_FAVICON: "logo_favicon", // Favicon
  SITE_NAME: "site_name", // Nome do site
  SITE_DESCRIPTION: "site_description", // Descrição do site
  PRIMARY_COLOR: "primary_color", // Cor primária
  ALLOW_REGISTRATION: "allow_registration", // Permitir registro de novos usuários
} as const;

export type ConfigKey = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS];

// Valores padrão
const DEFAULT_VALUES: Partial<Record<ConfigKey, string>> = {
  [CONFIG_KEYS.SITE_NAME]: "Simulab",
  [CONFIG_KEYS.SITE_DESCRIPTION]: "Plataforma de Simulados e Certificações",
  [CONFIG_KEYS.ALLOW_REGISTRATION]: "true",
};

/**
 * Busca uma configuração pelo nome da chave
 */
export async function getConfig(key: ConfigKey): Promise<string | null> {
  const config = await db.systemConfig.findUnique({
    where: { key },
  });

  if (!config) {
    return DEFAULT_VALUES[key] ?? null;
  }

  return config.value;
}

/**
 * Busca múltiplas configurações
 */
export async function getConfigs(
  keys: ConfigKey[]
): Promise<Record<string, string | null>> {
  const configs = await db.systemConfig.findMany({
    where: { key: { in: keys } },
  });

  const result: Record<string, string | null> = {};

  for (const key of keys) {
    const config = configs.find((c) => c.key === key);
    result[key] = config?.value ?? DEFAULT_VALUES[key] ?? null;
  }

  return result;
}

/**
 * Busca todas as configurações de logo
 */
export async function getLogoConfigs() {
  return getConfigs([
    CONFIG_KEYS.LOGO_LIGHT,
    CONFIG_KEYS.LOGO_DARK,
    CONFIG_KEYS.LOGO_FAVICON,
  ]);
}

/**
 * Define uma configuração
 */
export async function setConfig(
  key: ConfigKey,
  value: string,
  type: string = "string"
): Promise<void> {
  await db.systemConfig.upsert({
    where: { key },
    update: { value, type },
    create: { key, value, type },
  });
}

/**
 * Define múltiplas configurações
 */
export async function setConfigs(
  configs: Array<{ key: ConfigKey; value: string; type?: string }>
): Promise<void> {
  await db.$transaction(
    configs.map((config) =>
      db.systemConfig.upsert({
        where: { key: config.key },
        update: { value: config.value, type: config.type || "string" },
        create: {
          key: config.key,
          value: config.value,
          type: config.type || "string",
        },
      })
    )
  );
}

/**
 * Remove uma configuração
 */
export async function deleteConfig(key: ConfigKey): Promise<void> {
  await db.systemConfig.delete({
    where: { key },
  }).catch(() => {
    // Ignora se não existir
  });
}

/**
 * Busca todas as configurações
 */
export async function getAllConfigs(): Promise<
  Record<string, { value: string; type: string }>
> {
  const configs = await db.systemConfig.findMany();

  const result: Record<string, { value: string; type: string }> = {};

  for (const config of configs) {
    result[config.key] = { value: config.value, type: config.type };
  }

  // Adicionar valores padrão para chaves que não existem
  for (const [key, defaultValue] of Object.entries(DEFAULT_VALUES)) {
    if (!result[key]) {
      result[key] = { value: defaultValue, type: "string" };
    }
  }

  return result;
}
