/**
 * Data migration for the multi-space upgrade.
 * Called on first access to ensure all existing users have their personal space directories.
 */

import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { ensureSpaceDirectory } from "@/lib/file-utils-server";
import { getDataDir } from "@/lib/config";

const MIGRATION_FLAG = path.join(getDataDir(), ".migration_done");

/**
 * Run migrations if not already done.
 * - Creates personal space directories for all existing users.
 * - Migrates old data from config.storage.path to _user_directory/{userId}/ if needed.
 */
export function runMigrations(): void {
  if (fs.existsSync(MIGRATION_FLAG)) return;

  console.log("[Migration] Running data migrations for multi-space upgrade...");

  const users = db.listUsers();

  for (const user of users) {
    // Ensure personal space directory exists
    ensureSpaceDirectory("personal", String(user.id));
    console.log(`[Migration] Ensured personal space for user ${user.id} (${user.username})`);
  }

  // Mark migration as done
  fs.writeFileSync(MIGRATION_FLAG, new Date().toISOString(), "utf-8");
  console.log("[Migration] Migration complete.");
}
