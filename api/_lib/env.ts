// api/_lib/env.ts
import fs from 'node:fs';
import path from 'node:path';

let envLoaded = false;

/**
 * Ensures that environment variables from .env.local and .env
 * are loaded into process.env in local development/test environments.
 */
export function ensureEnvLoaded(): void {
  if (envLoaded) return;
  envLoaded = true;

  // If already configured in environment (e.g. Vercel deployment), nothing needed
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.APP_PASSWORD) {
    return;
  }

  const cwd = process.cwd();
  const envFiles = ['.env.local', '.env'];

  for (const file of envFiles) {
    const fullPath = path.resolve(cwd, file);
    if (fs.existsSync(fullPath)) {
      try {
        if (typeof (process as any).loadEnvFile === 'function') {
          (process as any).loadEnvFile(fullPath);
        } else {
          // Fallback parser if loadEnvFile is not available
          const content = fs.readFileSync(fullPath, 'utf8');
          content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
              const key = trimmed.substring(0, eqIdx).trim();
              let val = trimmed.substring(eqIdx + 1).trim();
              if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.substring(1, val.length - 1);
              }
              if (!process.env[key]) {
                process.env[key] = val;
              }
            }
          });
        }
      } catch (err) {
        console.warn(`Could not load env file ${file}:`, err);
      }
    }
  }
}
