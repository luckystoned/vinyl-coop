// tests/supabase-integration.test.ts
import { describe, it, expect } from 'vitest';
import { getInventory, getPracticeSessions, appendPracticeLog, isSupabaseConfigured } from '../api/_lib/supabase';
import type { TransitionLog } from '../src/types/practice';

describe('Supabase Integration Verification', () => {
  it('confirms Supabase is configured and connects successfully', async () => {
    expect(isSupabaseConfigured()).toBe(true);

    // 1. Fetch tracks
    const { tracks, demoMode } = await getInventory(true);
    expect(demoMode).toBe(false);
    expect(tracks.length).toBeGreaterThanOrEqual(490);

    const first = tracks[0];
    expect(first.id).toBeDefined();
    expect(first.artist).toBeDefined();
    expect(first.track).toBeDefined();

    // 2. Fetch sessions
    const { sessions, demoMode: sDemoMode } = await getPracticeSessions();
    expect(sDemoMode).toBe(false);
    expect(sessions.length).toBeGreaterThanOrEqual(1);

    // 3. Test saving a practice log and reading back
    const testLog: TransitionLog = {
      transition_id: `tr_test_${Date.now()}`,
      session_id: 'test_session_supabase',
      created_at: new Date().toISOString(),
      source_track_id: tracks[0].id,
      source_artist: tracks[0].artist,
      source_album: tracks[0].album,
      source_track: tracks[0].track,
      target_track_id: tracks[1].id,
      target_artist: tracks[1].artist,
      target_album: tracks[1].album,
      target_track: tracks[1].track,
      mode: 'precise',
      genre_filter: 'all',
      transition_type: 'beatmatch',
      suggested_pitch_pct: 0,
      used_pitch_pct: 0,
      pitch_bend_pct: null,
      rating: 5,
      notes: 'Test log from Vitest suite',
      recommendation_reasons: 'Test reason',
    };

    const saveResult = await appendPracticeLog(testLog);
    expect(saveResult.success).toBe(true);
    expect(saveResult.demoMode).toBe(false);

    // Verify it appears in sessions
    const { sessions: updatedSessions } = await getPracticeSessions();
    const foundSession = updatedSessions.find((s) => s.sessionId === 'test_session_supabase');
    expect(foundSession).toBeDefined();
    expect(foundSession?.transitionsCount).toBeGreaterThanOrEqual(1);
  });
});
