// api/_lib/auth.ts
import crypto from "node:crypto";

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
var failedAttempts = {};
function checkRateLimit(ip) {
  const now = Date.now();
  const record = failedAttempts[ip];
  if (!record) return { allowed: true };
  if (record.lockedUntil > now) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1e3);
    return { allowed: false, remainingSec };
  }
  if (record.lockedUntil <= now && record.count >= 5) {
    delete failedAttempts[ip];
  }
  return { allowed: true };
}
function recordLoginFailure(ip) {
  const now = Date.now();
  const record = failedAttempts[ip] || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + 60 * 1e3;
  }
  failedAttempts[ip] = record;
}
function recordLoginSuccess(ip) {
  delete failedAttempts[ip];
}
function getSecret() {
  return process.env.SESSION_SECRET || "default-dev-vinyl-coop-session-secret-key-32b";
}
function signSession(payload) {
  const secret = getSecret();
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}
function createSessionCookie() {
  const payload = `auth_${Date.now()}`;
  const signed = signSession(payload);
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${SESSION_COOKIE_NAME}=${signed}`,
    "Path=/",
    `Max-Age=${SESSION_MAX_AGE_SEC}`,
    "HttpOnly",
    "SameSite=Lax"
  ];
  if (isProd) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

// api/_lib/sheets.ts
import { google } from "googleapis";

// src/lib/normalization/inventory.ts
function slugify(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function generateTrackId(artist, album, track, vinylSide, occurrence = 1) {
  const parts = [
    slugify(artist) || "unknown-artist",
    slugify(album) || "unknown-album",
    slugify(track) || "unknown-track",
    slugify(vinylSide) || "side"
  ];
  if (occurrence > 1) {
    parts.push(occurrence.toString());
  }
  return parts.join("__");
}

// api/_lib/demoData.ts
var rawDemoList = [
  {
    artist: "Robert Hood",
    album: "Internal Empire",
    track: "Minus",
    bpm: 133,
    key: "Am",
    camelotKey: "8A",
    energy: 4,
    djUse: "Peak",
    vinylSide: "A1",
    tags: ["minimal", "detroit", "classic"],
    genre: "Techno"
  },
  {
    artist: "Jeff Mills",
    album: "Waveform Transmission Vol. 1",
    track: "The Bells",
    bpm: 135,
    key: "Am",
    camelotKey: "8A",
    energy: 5,
    djUse: "Peak",
    vinylSide: "A",
    tags: ["peak-time", "detroit", "loop"],
    genre: "Techno"
  },
  {
    artist: "Surgeon",
    album: "Basictonalvocabulary",
    track: "Magneze",
    bpm: 134,
    key: "Dm",
    camelotKey: "7A",
    energy: 5,
    djUse: "Peak",
    vinylSide: "B1",
    tags: ["industrial", "birmingham", "raw"],
    genre: "Techno"
  },
  {
    artist: "Drexciya",
    album: "Neptune's Lair",
    track: "Andreaen Sand Dunes",
    bpm: 131,
    key: "Am",
    camelotKey: "8A",
    energy: 4,
    djUse: "Mid",
    vinylSide: "A1",
    tags: ["detroit", "aquatic", "analog"],
    genre: "Electro"
  },
  {
    artist: "Anthony Rother",
    album: "Sex With The Machines",
    track: "Biomechanik",
    bpm: 132,
    key: "Em",
    camelotKey: "9A",
    energy: 4,
    djUse: "Mid",
    vinylSide: "B2",
    tags: ["vocoder", "german", "808"],
    genre: "Electro"
  },
  {
    artist: "Overmono",
    album: "Diamond Cut / Bumper",
    track: "Bumper",
    bpm: 130,
    key: "Fm",
    camelotKey: "4A",
    energy: 3,
    djUse: "Mid",
    vinylSide: "A",
    tags: ["bass", "uk", "breaks"],
    genre: "Breaks / UK Bass"
  },
  {
    artist: "Special Request",
    album: "Vortex",
    track: "SP412",
    bpm: 133,
    key: "Dm",
    camelotKey: "7A",
    energy: 4,
    djUse: "Peak",
    vinylSide: "A1",
    tags: ["rave", "hardcore", "breakbeat"],
    genre: "Breaks / UK Bass"
  },
  {
    artist: "Aphex Twin",
    album: "Selected Ambient Works 85-92",
    track: "Xtal",
    bpm: 114,
    key: "A",
    camelotKey: "11B",
    energy: 2,
    djUse: "Warmup",
    vinylSide: "A1",
    tags: ["braindance", "lush", "ambient"],
    genre: "IDM / Experimental"
  },
  {
    artist: "Boards of Canada",
    album: "Music Has the Right to Children",
    track: "Roygbiv",
    bpm: 84,
    key: "C",
    camelotKey: "8B",
    energy: 2,
    djUse: "Downtempo",
    vinylSide: "B1",
    tags: ["nostalgia", "analog", "synth"],
    genre: "Ambient / Downtempo"
  },
  {
    artist: "Moodymann",
    album: "Silentintroduction",
    track: "I Can't Kick This Feelin On",
    bpm: 124,
    key: "Gm",
    camelotKey: "6A",
    energy: 3,
    djUse: "Groove",
    vinylSide: "A1",
    tags: ["deep", "detroit", "soul-sample"],
    genre: "House"
  },
  {
    artist: "Kerri Chandler",
    album: "Atmosphere EP",
    track: "Track 1",
    bpm: 123,
    key: "Cm",
    camelotKey: "5A",
    energy: 3,
    djUse: "Groove",
    vinylSide: "A",
    tags: ["deep-house", "jersey", "bassline"],
    genre: "House"
  },
  {
    artist: "Metro Area",
    album: "Metro Area",
    track: "Miura",
    bpm: 118,
    key: "Fm",
    camelotKey: "4A",
    energy: 3,
    djUse: "Groove",
    vinylSide: "A",
    tags: ["boogie", "nu-disco", "strings"],
    genre: "Disco / Indie Dance"
  },
  {
    artist: "Talking Heads",
    album: "Remain in Light",
    track: "Once in a Lifetime",
    bpm: 117,
    key: "D",
    camelotKey: "10B",
    energy: 3,
    djUse: "Eclectic",
    vinylSide: "A4",
    tags: ["post-punk", "afrobeat", "new-wave"],
    genre: "Rock"
  },
  {
    artist: "Brian Eno",
    album: "Ambient 1: Music for Airports",
    track: "1/1",
    bpm: null,
    // intentionally null BPM to test incomplete info
    key: "Db",
    camelotKey: "3B",
    energy: 1,
    djUse: "Chill",
    vinylSide: "A",
    tags: ["minimalist", "piano", "tape-loop"],
    genre: "Ambient / Downtempo"
  }
];
var DEMO_TRACKS = rawDemoList.map((item) => ({
  id: generateTrackId(item.artist, item.album, item.track, item.vinylSide, 1),
  artist: item.artist,
  album: item.album,
  track: item.track,
  bpm: item.bpm,
  key: item.key,
  camelotKey: item.camelotKey,
  energy: item.energy,
  djUse: item.djUse,
  vinylSide: item.vinylSide,
  tags: item.tags,
  coverUrl: null,
  genre: item.genre
}));

// api/_lib/sheets.ts
ensureEnvLoaded();
var CACHE_TTL_MS = 10 * 60 * 1e3;
function isGoogleSheetsConfigured() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  return Boolean(email && email.trim() && key && key.trim());
}

// api/_lib/http.ts
async function parseJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => {
      resolve({});
    });
  });
}
function sendJson(res, status, data, headers = {}) {
  for (const [key, val] of Object.entries(headers)) {
    res.setHeader(key, val);
  }
  res.setHeader("Content-Type", "application/json");
  res.statusCode = status;
  res.end(JSON.stringify(data));
}
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "127.0.0.1";
}

// api/login.ts
async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method Not Allowed" });
  }
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return sendJson(res, 429, {
      error: `Demasiados intentos fallidos. Por favor espera ${rateLimit.remainingSec} segundos.`
    });
  }
  const body = await parseJsonBody(req);
  const password = body.password?.trim();
  const configuredPassword = process.env.APP_PASSWORD || "vinylcoop";
  if (!password || password !== configuredPassword) {
    recordLoginFailure(ip);
    return sendJson(res, 401, { error: "Contrase\xF1a incorrecta" });
  }
  recordLoginSuccess(ip);
  const cookie = createSessionCookie();
  const sheetConfigured = isGoogleSheetsConfigured();
  return sendJson(
    res,
    200,
    {
      success: true,
      sheetConfigured,
      demoMode: !sheetConfigured
    },
    { "Set-Cookie": cookie }
  );
}
export {
  handler as default
};
