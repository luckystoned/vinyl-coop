// api/_lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ensureEnvLoaded } from './env.js';
import type { Track } from '../../src/types/track';
import type { TransitionLog, PracticeSession } from '../../src/types/practice';
import { DEMO_TRACKS } from './demoData.js';

ensureEnvLoaded();

let supabaseInstance: SupabaseClient | null = null;

// In-memory cache for tracks to keep performance snappy
let cachedTracks: Track[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && url.trim() && key && key.trim());
}

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials (SUPABASE_URL, SUPABASE_ANON_KEY) are not configured.');
  }

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}

export function mapDbTrackToTrack(row: any): Track {
  return {
    id: row.id,
    artist: row.artist || '',
    album: row.album || '',
    track: row.track || '',
    bpm: row.bpm !== null && row.bpm !== undefined ? Number(row.bpm) : null,
    key: row.key || '',
    camelotKey: row.camelot_key || null,
    energy: row.energy !== null && row.energy !== undefined ? Number(row.energy) : null,
    djUse: row.dj_use || '',
    vinylSide: row.vinyl_side || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    coverUrl: row.cover_url || null,
    genre: row.genre || 'Other',
  };
}

export function mapDbLogToTransitionLog(row: any): TransitionLog {
  return {
    transition_id: row.transition_id,
    session_id: row.session_id,
    created_at: typeof row.created_at === 'string' ? row.created_at : new Date(row.created_at).toISOString(),
    source_track_id: row.source_track_id,
    source_artist: row.source_artist || '',
    source_album: row.source_album || '',
    source_track: row.source_track || '',
    target_track_id: row.target_track_id,
    target_artist: row.target_artist || '',
    target_album: row.target_album || '',
    target_track: row.target_track || '',
    mode: row.mode || 'precise',
    genre_filter: row.genre_filter || 'same_genre',
    transition_type: row.transition_type || 'beatmatch',
    suggested_pitch_pct: row.suggested_pitch_pct !== null ? Number(row.suggested_pitch_pct) : 0,
    used_pitch_pct: row.used_pitch_pct !== null ? Number(row.used_pitch_pct) : 0,
    pitch_bend_pct: row.pitch_bend_pct !== null ? Number(row.pitch_bend_pct) : null,
    rating: row.rating !== null ? Number(row.rating) : null,
    notes: row.notes || '',
    recommendation_reasons: row.recommendation_reasons || '',
  };
}

export async function getInventory(forceRefresh: boolean = false): Promise<{ tracks: Track[]; demoMode: boolean }> {
  if (!isSupabaseConfigured()) {
    return { tracks: DEMO_TRACKS, demoMode: true };
  }

  const now = Date.now();
  if (!forceRefresh && cachedTracks && now - lastCacheTime < CACHE_TTL_MS) {
    return { tracks: cachedTracks, demoMode: false };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .order('artist', { ascending: true });

  if (error) {
    console.error('Error fetching tracks from Supabase:', error);
    if (process.env.NODE_ENV !== 'production' && !cachedTracks) {
      return { tracks: DEMO_TRACKS, demoMode: true };
    }
    throw error;
  }

  const tracks = (data || []).map(mapDbTrackToTrack);
  cachedTracks = tracks;
  lastCacheTime = now;

  return { tracks, demoMode: false };
}

export async function appendPracticeLog(log: TransitionLog): Promise<{
  success: boolean;
  demoMode: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { success: true, demoMode: true };
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('practice_logs').insert({
    transition_id: log.transition_id,
    session_id: log.session_id,
    created_at: log.created_at,
    source_track_id: log.source_track_id,
    source_artist: log.source_artist,
    source_album: log.source_album,
    source_track: log.source_track,
    target_track_id: log.target_track_id,
    target_artist: log.target_artist,
    target_album: log.target_album,
    target_track: log.target_track,
    mode: log.mode,
    genre_filter: log.genre_filter,
    transition_type: log.transition_type,
    suggested_pitch_pct: log.suggested_pitch_pct,
    used_pitch_pct: log.used_pitch_pct,
    pitch_bend_pct: log.pitch_bend_pct,
    rating: log.rating,
    notes: log.notes,
    recommendation_reasons: log.recommendation_reasons,
  });

  if (error) {
    console.error('Error saving practice log to Supabase:', error);
    throw error;
  }

  return { success: true, demoMode: false };
}

export async function getPracticeSessions(): Promise<{ sessions: PracticeSession[]; demoMode: boolean }> {
  if (!isSupabaseConfigured()) {
    return { sessions: [], demoMode: true };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('practice_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching practice logs from Supabase:', error);
    throw error;
  }

  const logs = (data || []).map(mapDbLogToTransitionLog);
  return {
    sessions: groupTransitionsIntoSessions(logs),
    demoMode: false,
  };
}

export function groupTransitionsIntoSessions(logs: TransitionLog[]): PracticeSession[] {
  const groups: Record<string, TransitionLog[]> = {};

  for (const log of logs) {
    const sId = log.session_id || 'unassigned';
    if (!groups[sId]) {
      groups[sId] = [];
    }
    groups[sId].push(log);
  }

  const sessions: PracticeSession[] = [];

  for (const [sessionId, items] of Object.entries(groups)) {
    // Sort chronological ascending within session
    items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const first = items[0];
    const last = items[items.length - 1];

    sessions.push({
      sessionId,
      createdAt: first.created_at,
      updatedAt: last.created_at,
      transitionsCount: items.length,
      firstTrackName: `${first.source_artist} - ${first.source_track}`,
      lastTrackName: `${last.target_artist} - ${last.target_track}`,
      transitions: items,
    });
  }

  // Sort sessions newest first
  sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return sessions;
}

export async function saveTrack(track: Track): Promise<{ success: boolean; track: Track }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('tracks').upsert({
    id: track.id,
    artist: track.artist,
    album: track.album,
    track: track.track,
    bpm: track.bpm,
    key: track.key || null,
    camelot_key: track.camelotKey || null,
    energy: track.energy,
    dj_use: track.djUse || '',
    vinyl_side: track.vinylSide || '',
    tags: track.tags || [],
    cover_url: track.coverUrl || null,
    genre: track.genre || 'Other',
  });

  if (error) {
    console.error('Error saving track to Supabase:', error);
    throw error;
  }

  // Invalidate cache
  cachedTracks = null;
  return { success: true, track };
}

export async function deleteTrack(trackId: string): Promise<{ success: boolean }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('tracks').delete().eq('id', trackId);

  if (error) {
    console.error('Error deleting track from Supabase:', error);
    throw error;
  }

  cachedTracks = null;
  return { success: true };
}
