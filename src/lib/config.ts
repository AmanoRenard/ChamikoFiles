import fs from "fs";
import path from "path";
import os from "os";
import { AppConfig } from "@/types";

/**
 * Get the data directory where config.ini and JSON data files are stored.
 * Priority:
 *   1. CHAMIKO_DATA_DIR environment variable (if set)
 *   2. Windows: C:\ProgramData\Chamiko\Chamiko Files
 *   3. Other: ~/ChamikoFiles
 */
export function getDataDir(): string {
  if (process.env.CHAMIKO_DATA_DIR) {
    return path.resolve(process.env.CHAMIKO_DATA_DIR);
  }
  if (process.platform === "win32") {
    return path.join(
      process.env.ProgramData || "C:\\ProgramData",
      "Chamiko",
      "Chamiko Files"
    );
  }
  return path.join(os.homedir(), "ChamikoFiles");
}

/** Ensure the data directory exists on first access */
function ensureDataDir(): void {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const CONFIG_PATH = (() => {
  ensureDataDir();
  return path.join(getDataDir(), "config.ini");
})();

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
    system: {},
    storage: {
      path: "uploads",
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
    site: {
      name: "ChamikoFiles",
      description: "私人云盘",
    },
    upload: {
      maxFileSize: 524288000,      // 500 MB
      maxFilesPerBatch: 50,
    },
    security: {
      maxLoginAttempts: 5,
      lockoutMinutes: 15,
      sessionTimeoutHours: 168,    // 7 days
    },
    notification: {
      storageAlertPercent: 80,
    },
  };
}

/** Safely parse a numeric value, returning defaultValue when absent or invalid */
function safeInt(val: string | undefined, defaultValue: number): number {
  if (val === undefined) return defaultValue;
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? defaultValue : n;
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
      system: {},
      storage: {
        path: parsed.storage?.path || "",
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
      site: {
        name: parsed.site?.name || defaultConfig.site.name,
        description: parsed.site?.description || defaultConfig.site.description,
      },
      upload: {
        maxFileSize: safeInt(parsed.upload?.maxFileSize, defaultConfig.upload.maxFileSize),
        maxFilesPerBatch: safeInt(parsed.upload?.maxFilesPerBatch, defaultConfig.upload.maxFilesPerBatch),
      },
      security: {
        maxLoginAttempts: safeInt(parsed.security?.maxLoginAttempts, defaultConfig.security.maxLoginAttempts),
        lockoutMinutes: safeInt(parsed.security?.lockoutMinutes, defaultConfig.security.lockoutMinutes),
        sessionTimeoutHours: safeInt(parsed.security?.sessionTimeoutHours, defaultConfig.security.sessionTimeoutHours),
      },
      notification: {
        storageAlertPercent: safeInt(parsed.notification?.storageAlertPercent, defaultConfig.notification.storageAlertPercent),
      },
    };
  } catch {
    return defaultConfig;
  }
}

export function writeConfig(config: AppConfig): void {
  const data: Record<string, Record<string, string>> = {};
  data.storage = {
    path: config.storage.path,
    maxSpace: String(config.storage.maxSpace),
    allowedTypes: config.storage.allowedTypes,
  };
  data.display = {
    viewMode: config.display.viewMode,
    sortBy: config.display.sortBy,
    sortOrder: config.display.sortOrder,
  };
  data.quota = {
    defaultPersonalQuota: String(config.quota.defaultPersonalQuota),
    defaultSharedQuota: String(config.quota.defaultSharedQuota),
    maxSharedSpaces: String(config.quota.maxSharedSpaces),
  };
  data.site = {
    name: config.site.name,
    description: config.site.description,
  };
  data.upload = {
    maxFileSize: String(config.upload.maxFileSize),
    maxFilesPerBatch: String(config.upload.maxFilesPerBatch),
  };
  data.security = {
    maxLoginAttempts: String(config.security.maxLoginAttempts),
    lockoutMinutes: String(config.security.lockoutMinutes),
    sessionTimeoutHours: String(config.security.sessionTimeoutHours),
  };
  data.notification = {
    storageAlertPercent: String(config.notification.storageAlertPercent),
  };
  const content = serializeIni(data);
  fs.writeFileSync(CONFIG_PATH, content, "utf-8");
}

export function updateConfig(partial: Partial<AppConfig>): AppConfig {
  const current = readConfig();
  const updated: AppConfig = {
    system: {},
    storage: { ...current.storage, ...(partial.storage || {}) },
    display: { ...current.display, ...(partial.display || {}) },
    quota: { ...current.quota, ...(partial.quota || {}) },
    site: { ...current.site, ...(partial.site || {}) },
    upload: { ...current.upload, ...(partial.upload || {}) },
    security: { ...current.security, ...(partial.security || {}) },
    notification: { ...current.notification, ...(partial.notification || {}) },
  };
  writeConfig(updated);
  return updated;
}
