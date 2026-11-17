// api/_lib/env.ts
import fs from "node:fs";
import path from "node:path";
var envLoaded = false;
function ensureEnvLoaded() {
  if (envLoaded) return;
  envLoaded = true;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.APP_PASSWORD) {
    return;
  }
  const cwd = process.cwd();
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(cwd, file);
    if (fs.existsSync(fullPath)) {
      try {
        if (typeof process.loadEnvFile === "function") {
          process.loadEnvFile(fullPath);
        } else {
          const content = fs.readFileSync(fullPath, "utf8");
          content.split("\n").forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) return;
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx > 0) {
              const key = trimmed.substring(0, eqIdx).trim();
              let val = trimmed.substring(eqIdx + 1).trim();
              if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
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

// api/_lib/auth.ts
ensureEnvLoaded();
var SESSION_COOKIE_NAME = "vc_session";
var SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;
function createLogoutCookie() {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "HttpOnly",
    "SameSite=Lax"
  ];
  if (isProd) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

// api/_lib/http.ts
function sendJson(res, status, data, headers = {}) {
  for (const [key, val] of Object.entries(headers)) {
    res.setHeader(key, val);
  }
  res.setHeader("Content-Type", "application/json");
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

// api/logout.ts
async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method Not Allowed" });
  }
  const cookie = createLogoutCookie();
  return sendJson(
    res,
    200,
    { success: true },
    { "Set-Cookie": cookie }
  );
}
export {
  handler as default
};
