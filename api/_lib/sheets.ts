// api/_lib/sheets.ts
import { google } from 'googleapis';
import type { Track } from '../../src/types/track';
import type { TransitionLog, PracticeSession } from '../../src/types/practice';
import { normalizeInventoryRows } from './normalization.js';
import { DEMO_TRACKS } from './demoData.js';
import { ensureEnvLoaded } from './env.js';

ensureEnvLoaded();

const DEFAULT_SHEET_ID = '1oXiGomNeglmygM6hHFqbpmz28v5JySONhxWppVujjCg';

// In-memory cache for inventory
let cachedInventory: Track[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

// In-memory store for demo mode transitions
const demoPracticeLogs: TransitionLog[] = [];

export function isGoogleSheetsConfigured(): boolean {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  return Boolean(email && email.trim() && key && key.trim());
}

export function getSpreadsheetId(): string {
  return process.env.GOOGLE_SHEET_ID?.trim() || DEFAULT_SHEET_ID;
}

function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  let key = process.env.GOOGLE_PRIVATE_KEY?.trim();

  if (!email || !key) {
    throw new Error('Google Sheets Service Account credentials not configured.');
  }

  // Handle escaped newlines in environment variable
  key = key.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Fetches inventory tracks from the "Vinyl Inventory" tab of the Google Sheet.
 * Utilizes in-memory caching unless forceRefresh is true.
 */
export async function getInventory(forceRefresh: boolean = false): Promise<{ tracks: Track[]; demoMode: boolean }> {
  if (!isGoogleSheetsConfigured()) {
    return { tracks: DEMO_TRACKS, demoMode: true };
  }

  const now = Date.now();
  if (!forceRefresh && cachedInventory && (now - lastCacheTime < CACHE_TTL_MS)) {
    return { tracks: cachedInventory, demoMode: false };
  }

  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Vinyl Inventory'!A:L",
    });

    const rows = response.data.values as (string | undefined)[][] | undefined;
    if (!rows || rows.length === 0) {
      return { tracks: [], demoMode: false };
    }

    const normalizedTracks = normalizeInventoryRows(rows);
    cachedInventory = normalizedTracks;
    lastCacheTime = now;

    return { tracks: normalizedTracks, demoMode: false };
  } catch (error) {
    console.error('Error fetching inventory from Google Sheets:', error);
    // If running in development and sheets fetch fails, fallback to demo with error note
    if (process.env.NODE_ENV !== 'production') {
      return { tracks: DEMO_TRACKS, demoMode: true };
    }
    throw error;
  }
}

/**
 * Appends a transition log row to the "Practice_Log" tab with RAW formatting.
 */
export async function appendPracticeLog(log: TransitionLog): Promise<{
  success: boolean;
  demoMode: boolean;
  updatedRange?: string;
  updatedRows?: number;
}> {
  if (process.env.MOCK_SHEETS === 'true' || !isGoogleSheetsConfigured()) {
    // Demo / mock mode: record in local memory store so user can see it in Historial during demo
    demoPracticeLogs.unshift(log);
    return { success: true, demoMode: true };
  }

  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // Exactly 20 columns in specified order
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
    log.pitch_bend_pct !== null ? log.pitch_bend_pct.toString() : '',
    log.rating !== null ? log.rating.toString() : '',
    log.notes || '',
    log.recommendation_reasons || '',
  ];

  const appendRes = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "'Practice_Log'!A:T",
    valueInputOption: 'RAW', // Essential: prevent formulas or formatting corruption
    requestBody: {
      values: [row],
    },
  });

  const updatedRange = appendRes.data.updates?.updatedRange || undefined;
  const updatedRows = appendRes.data.updates?.updatedRows || 1;

  return { success: true, demoMode: false, updatedRange, updatedRows };
}

/**
 * Fetches all practice transitions from "Practice_Log",
 * parses them, and groups them into sessions sorted newest first.
 */
export async function getPracticeSessions(): Promise<{ sessions: PracticeSession[]; demoMode: boolean }> {
  if (!isGoogleSheetsConfigured()) {
    return {
      sessions: groupTransitionsIntoSessions(demoPracticeLogs),
      demoMode: true,
    };
  }

  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Practice_Log'!A2:T", // Skip header row
    });

    const rows = response.data.values as (string | undefined)[][] | undefined;
    if (!rows || rows.length === 0) {
      return { sessions: [], demoMode: false };
    }

    const transitions: TransitionLog[] = rows.map((r, idx) => {
      const getVal = (colIdx: number) => (r[colIdx] !== undefined && r[colIdx] !== null ? r[colIdx]!.toString().trim() : '');

      return {
        transition_id: getVal(0) || `trans_${idx}`,
        session_id: getVal(1) || 'default_session',
        created_at: getVal(2) || new Date().toISOString(),
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
        transition_type: (getVal(13) as any) || 'beatmatch',
        suggested_pitch_pct: parseFloat(getVal(14)) || 0,
        used_pitch_pct: parseFloat(getVal(15)) || 0,
        pitch_bend_pct: getVal(16) ? parseFloat(getVal(16)) : null,
        rating: getVal(17) ? parseInt(getVal(17), 10) : null,
        notes: getVal(18),
        recommendation_reasons: getVal(19),
      };
    });

    return {
      sessions: groupTransitionsIntoSessions(transitions),
      demoMode: false,
    };
  } catch (error) {
    console.error('Error fetching practice logs from Google Sheets:', error);
    if (process.env.NODE_ENV !== 'production') {
      return {
        sessions: groupTransitionsIntoSessions(demoPracticeLogs),
        demoMode: true,
      };
    }
    throw error;
  }
}

/**
 * Groups a flat list of transitions by session_id,
 * ordering sessions by newest created_at date.
 */
export function groupTransitionsIntoSessions(transitions: TransitionLog[]): PracticeSession[] {
  const sessionMap = new Map<string, TransitionLog[]>();

  for (const t of transitions) {
    const list = sessionMap.get(t.session_id) || [];
    list.push(t);
    sessionMap.set(t.session_id, list);
  }

  const sessions: PracticeSession[] = [];

  for (const [sessionId, items] of sessionMap.entries()) {
    // Sort transitions within session chronologically (oldest first)
    items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const firstTrack = items[0]?.source_track || 'Desconocido';
    const lastTrack = items[items.length - 1]?.target_track || 'Desconocido';
    const createdAt = items[0]?.created_at || new Date().toISOString();
    const updatedAt = items[items.length - 1]?.created_at || createdAt;

    sessions.push({
      sessionId,
      createdAt,
      updatedAt,
      transitionsCount: items.length,
      firstTrackName: firstTrack,
      lastTrackName: lastTrack,
      transitions: items,
    });
  }

  // Sort sessions descending by latest activity (updatedAt)
  sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return sessions;
}
