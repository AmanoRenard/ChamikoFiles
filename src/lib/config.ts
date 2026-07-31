import fs from "fs";
import path from "path";
import { AppConfig } from "@/types";

const CONFIG_PATH = path.join(process.cwd(), "config.ini");

function parseIni(content: string): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  let currentSection = "";

  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#") || trimmed.startsWith(";")) {
      continue;
    }
    const sectionMatch = trimmed.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      if (!result[currentSection]) {
        result[currentSection] = {};
      }
      continue;
    }
    const kvMatch = trimmed.match(/^([^=]+)=(.*)$/);
    if (kvMatch && currentSection) {
      const key = kvMatch[1].trim();
      const value = kvMatch[2].trim();
      result[currentSection][key] = value;
    }
  }
  return result;
}

function serializeIni(data: Record<string, Record<string, string>>): string {
  const lines: string[] = [];
  for (const [section, entries] of Object.entries(data)) {
    lines.push(`[${section}]`);
    for (const [key, value] of Object.entries(entries)) {
      lines.push(`${key} = ${value}`);
    }
    lines.push("");
  }
  return lines.join("\r\n").trimEnd() + "\r\n";
}

function getDefaultConfig(): AppConfig {
  return {
    storage: {
      path: "C:\\Users\\Chamiko\\Downloads\\隔空投送",
      maxSpace: 10737418240,
      allowedTypes: "",
    },
    display: {
      viewMode: "grid",
      sortBy: "date",
      sortOrder: "desc",
    },
    quota: {
      defaultPersonalQuota: -1,
      defaultSharedQuota: -1,
      maxSharedSpaces: 3,
    },
  };
}

export function readConfig(): AppConfig {
  const defaultConfig = getDefaultConfig();
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      writeConfig(defaultConfig);
      return defaultConfig;
    }
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const parsed = parseIni(raw);

    return {
      storage: {
        path: parsed.storage?.path || defaultConfig.storage.path,
        maxSpace: parseInt(parsed.storage?.maxSpace || String(defaultConfig.storage.maxSpace), 10),
        allowedTypes: parsed.storage?.allowedTypes || defaultConfig.storage.allowedTypes,
      },
      display: {
        viewMode: (parsed.display?.viewMode as "grid" | "list") || defaultConfig.display.viewMode,
        sortBy: (parsed.display?.sortBy as "name" | "size" | "date") || defaultConfig.display.sortBy,
        sortOrder: (parsed.display?.sortOrder as "asc" | "desc") || defaultConfig.display.sortOrder,
      },
      quota: {
        defaultPersonalQuota: parseInt(parsed.quota?.defaultPersonalQuota || String(defaultConfig.quota.defaultPersonalQuota), 10),
        defaultSharedQuota: parseInt(parsed.quota?.defaultSharedQuota || String(defaultConfig.quota.defaultSharedQuota), 10),
        maxSharedSpaces: parseInt(parsed.quota?.maxSharedSpaces || String(defaultConfig.quota.maxSharedSpaces), 10),
      },
    };
  } catch {
    return defaultConfig;
  }
}

export function writeConfig(config: AppConfig): void {
  const data = {
    storage: {
      path: config.storage.path,
      maxSpace: String(config.storage.maxSpace),
      allowedTypes: config.storage.allowedTypes,
    },
    display: {
      viewMode: config.display.viewMode,
      sortBy: config.display.sortBy,
      sortOrder: config.display.sortOrder,
    },
    quota: {
      defaultPersonalQuota: String(config.quota.defaultPersonalQuota),
      defaultSharedQuota: String(config.quota.defaultSharedQuota),
      maxSharedSpaces: String(config.quota.maxSharedSpaces),
    },
  };
  const content = serializeIni(data);
  fs.writeFileSync(CONFIG_PATH, content, "utf-8");
}

export function updateConfig(partial: Partial<AppConfig>): AppConfig {
  const current = readConfig();
  const updated: AppConfig = {
    storage: { ...current.storage, ...(partial.storage || {}) },
    display: { ...current.display, ...(partial.display || {}) },
    quota: { ...current.quota, ...(partial.quota || {}) },
  };
  writeConfig(updated);
  return updated;
}
