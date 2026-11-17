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
function getSecret() {
  return process.env.SESSION_SECRET || "default-dev-vinyl-coop-session-secret-key-32b";
}
function verifySessionToken(token) {
  if (!token || !token.includes(".")) return false;
  const lastDot = token.lastIndexOf(".");
  const payload = token.substring(0, lastDot);
  const signature = token.substring(lastDot + 1);
  const secret = getSecret();
  const expectedHmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac));
  } catch {
    return false;
  }
}
function isRequestAuthenticated(cookieHeader) {
  if (!cookieHeader) return false;
  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return false;
  return verifySessionToken(token);
}
function parseCookies(cookieHeader) {
  const list = {};
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      list[name] = decodeURIComponent(val);
    }
  });
  return list;
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
var DEFAULT_SHEET_ID = "1oXiGomNeglmygM6hHFqbpmz28v5JySONhxWppVujjCg";
var CACHE_TTL_MS = 10 * 60 * 1e3;
var demoPracticeLogs = [];
function isGoogleSheetsConfigured() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  return Boolean(email && email.trim() && key && key.trim());
}
function getSpreadsheetId() {
  return process.env.GOOGLE_SHEET_ID?.trim() || DEFAULT_SHEET_ID;
}
function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  let key = process.env.GOOGLE_PRIVATE_KEY?.trim();
  if (!email || !key) {
    throw new Error("Google Sheets Service Account credentials not configured.");
  }
  key = key.replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
  return google.sheets({ version: "v4", auth });
}
async function appendPracticeLog(log) {
  if (process.env.MOCK_SHEETS === "true" || !isGoogleSheetsConfigured()) {
    demoPracticeLogs.unshift(log);
    return { success: true, demoMode: true };
  }
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const row = [
    log.transition_id,
    log.session_id,
    log.created_at,
    log.source_track_id,
    log.source_artist,
    log.source_album,
    log.source_track,
    log.target_track_id,
    log.target_artist,
    log.target_album,
    log.target_track,
    log.mode,
    log.genre_filter,
    log.transition_type,
    log.suggested_pitch_pct.toString(),
    log.used_pitch_pct.toString(),
    log.pitch_bend_pct !== null ? log.pitch_bend_pct.toString() : "",
    log.rating !== null ? log.rating.toString() : "",
    log.notes || "",
    log.recommendation_reasons || ""
  ];
  const appendRes = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "'Practice_Log'!A:T",
    valueInputOption: "RAW",
    // Essential: prevent formulas or formatting corruption
    requestBody: {
      values: [row]
    }
  });
  const updatedRange = appendRes.data.updates?.updatedRange || void 0;
  const updatedRows = appendRes.data.updates?.updatedRows || 1;
  return { success: true, demoMode: false, updatedRange, updatedRows };
}

// api/_lib/idempotency.ts
var seenTokens = /* @__PURE__ */ new Map();
var TOKEN_TTL_MS = 10 * 60 * 1e3;
function checkAndStoreToken(clientToken, transitionId) {
  const now = Date.now();
  for (const [token, data] of seenTokens.entries()) {
    if (now - data.timestamp > TOKEN_TTL_MS) {
      seenTokens.delete(token);
    }
  }
  if (seenTokens.has(clientToken)) {
    const existing = seenTokens.get(clientToken);
    return { duplicate: true, existingId: existing.transitionId };
  }
  seenTokens.set(clientToken, { timestamp: now, transitionId });
  return { duplicate: false };
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

// api/transitions.ts
async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method Not Allowed" });
  }
  const isAuth = isRequestAuthenticated(req.headers.cookie);
  if (!isAuth) {
    return sendJson(res, 401, { error: "No autenticado. Por favor inicia sesi\xF3n." });
  }
  const payload = await parseJsonBody(req);
  if (!payload.session_id || !payload.source_track_id || !payload.target_track_id) {
    return sendJson(res, 400, { error: "Faltan campos obligatorios de la transici\xF3n" });
  }
  const clientToken = payload.client_token || `${payload.session_id}_${payload.source_track_id}_${payload.target_track_id}_${payload.used_pitch_pct}`;
  const transitionId = `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const idempotency = checkAndStoreToken(clientToken, transitionId);
  if (idempotency.duplicate) {
    return sendJson(res, 409, {
      error: "Esta transici\xF3n ya fue registrada previamente.",
      duplicate: true,
      existingId: idempotency.existingId
    });
  }
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const transitionLog = {
    transition_id: transitionId,
    session_id: payload.session_id.trim(),
    created_at: createdAt,
    source_track_id: payload.source_track_id,
    source_artist: payload.source_artist || "",
    source_album: payload.source_album || "",
    source_track: payload.source_track || "",
    target_track_id: payload.target_track_id,
    target_artist: payload.target_artist || "",
    target_album: payload.target_album || "",
    target_track: payload.target_track || "",
    mode: payload.mode || "precise",
    genre_filter: payload.genre_filter || "same_genre",
    transition_type: payload.transition_type || "beatmatch",
    suggested_pitch_pct: typeof payload.suggested_pitch_pct === "number" ? payload.suggested_pitch_pct : 0,
    used_pitch_pct: typeof payload.used_pitch_pct === "number" ? payload.used_pitch_pct : 0,
    pitch_bend_pct: typeof payload.pitch_bend_pct === "number" ? payload.pitch_bend_pct : null,
    rating: typeof payload.rating === "number" && payload.rating >= 1 && payload.rating <= 5 ? payload.rating : null,
    notes: (payload.notes || "").trim(),
    recommendation_reasons: Array.isArray(payload.recommendation_reasons) ? payload.recommendation_reasons.join("; ") : payload.recommendation_reasons || ""
  };
  try {
    const { success, demoMode, updatedRange } = await appendPracticeLog(transitionLog);
    return sendJson(res, 201, {
      success,
      transition: transitionLog,
      demoMode,
      updatedRange
    });
  } catch (error) {
    console.error("API /api/transitions write error:", error);
    return sendJson(res, 500, {
      error: error.message || "Error al guardar la transici\xF3n en Google Sheets"
    });
  }
}
export {
  handler as default
};
