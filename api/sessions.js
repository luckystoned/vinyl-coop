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
async function getPracticeSessions() {
  if (!isGoogleSheetsConfigured()) {
    return {
      sessions: groupTransitionsIntoSessions(demoPracticeLogs),
      demoMode: true
    };
  }
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Practice_Log'!A2:T"
      // Skip header row
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { sessions: [], demoMode: false };
    }
    const transitions = rows.map((r, idx) => {
      const getVal = (colIdx) => r[colIdx] !== void 0 && r[colIdx] !== null ? r[colIdx].toString().trim() : "";
      return {
        transition_id: getVal(0) || `trans_${idx}`,
        session_id: getVal(1) || "default_session",
        created_at: getVal(2) || (/* @__PURE__ */ new Date()).toISOString(),
        source_track_id: getVal(3),
        source_artist: getVal(4),
        source_album: getVal(5),
        source_track: getVal(6),
        target_track_id: getVal(7),
        target_artist: getVal(8),
        target_album: getVal(9),
        target_track: getVal(10),
        mode: getVal(11),
        genre_filter: getVal(12),
        transition_type: getVal(13) || "beatmatch",
        suggested_pitch_pct: parseFloat(getVal(14)) || 0,
        used_pitch_pct: parseFloat(getVal(15)) || 0,
        pitch_bend_pct: getVal(16) ? parseFloat(getVal(16)) : null,
        rating: getVal(17) ? parseInt(getVal(17), 10) : null,
        notes: getVal(18),
        recommendation_reasons: getVal(19)
      };
    });
    return {
      sessions: groupTransitionsIntoSessions(transitions),
      demoMode: false
    };
  } catch (error) {
    console.error("Error fetching practice logs from Google Sheets:", error);
    if (process.env.NODE_ENV !== "production") {
      return {
        sessions: groupTransitionsIntoSessions(demoPracticeLogs),
        demoMode: true
      };
    }
    throw error;
  }
}
function groupTransitionsIntoSessions(transitions) {
  const sessionMap = /* @__PURE__ */ new Map();
  for (const t of transitions) {
    const list = sessionMap.get(t.session_id) || [];
    list.push(t);
    sessionMap.set(t.session_id, list);
  }
  const sessions = [];
  for (const [sessionId, items] of sessionMap.entries()) {
    items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const firstTrack = items[0]?.source_track || "Desconocido";
    const lastTrack = items[items.length - 1]?.target_track || "Desconocido";
    const createdAt = items[0]?.created_at || (/* @__PURE__ */ new Date()).toISOString();
    const updatedAt = items[items.length - 1]?.created_at || createdAt;
    sessions.push({
      sessionId,
      createdAt,
      updatedAt,
      transitionsCount: items.length,
      firstTrackName: firstTrack,
      lastTrackName: lastTrack,
      transitions: items
    });
  }
  sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return sessions;
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

// api/sessions.ts
async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method Not Allowed" });
  }
  const isAuth = isRequestAuthenticated(req.headers.cookie);
  if (!isAuth) {
    return sendJson(res, 401, { error: "No autenticado. Por favor inicia sesi\xF3n." });
  }
  try {
    const { sessions, demoMode } = await getPracticeSessions();
    return sendJson(res, 200, {
      sessions,
      demoMode
    });
  } catch (error) {
    console.error("API /api/sessions error:", error);
    return sendJson(res, 500, { error: error.message || "Error al obtener historial" });
  }
}
export {
  handler as default
};
