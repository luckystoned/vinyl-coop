// tests/api.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import loginHandler from '../api/login';
import tracksHandler from '../api/tracks';
import sessionsHandler from '../api/sessions';
import transitionsHandler from '../api/transitions';
import { signSession } from '../api/_lib/auth';
import { groupTransitionsIntoSessions } from '../api/_lib/sheets';
import { TransitionLog } from '../src/types/practice';

// Lightweight mock helper for req and res
function createMockHttp(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
}) {
  const req = {
    method: options.method || 'GET',
    url: options.url || '/',
    headers: { host: 'localhost', ...(options.headers || {}) },
    body: options.body || {},
    on: (event: string, cb: any) => {
      if (event === 'data' && options.body) {
        cb(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      if (event === 'end') cb();
    },
  };

  const resData: {
    statusCode: number;
    headers: Record<string, string>;
    body: any;
  } = {
    statusCode: 200,
    headers: {},
    body: null,
  };

  const res = {
    statusCode: 200,
    setHeader: (name: string, val: string) => {
      resData.headers[name.toLowerCase()] = val;
    },
    end: (chunk: string) => {
      resData.statusCode = res.statusCode;
      try {
        resData.body = JSON.parse(chunk);
      } catch {
        resData.body = chunk;
      }
    },
  };

  return { req, res, resData };
}

describe('API Endpoints, Security & Session Logic', () => {
  beforeEach(() => {
    process.env.APP_PASSWORD = 'test-secret-password';
    process.env.SESSION_SECRET = 'test-session-secret-key-for-tests';
    process.env.MOCK_SHEETS = 'true';
  });

  // Mandatory Test 15: Protection of endpoints without authenticated session
  it('rejects unauthenticated requests with 401 on protected endpoints', async () => {
    // 1. GET /api/tracks without cookie
    const tracksMock = createMockHttp({ method: 'GET', url: '/api/tracks' });
    await tracksHandler(tracksMock.req, tracksMock.res);
    expect(tracksMock.resData.statusCode).toBe(401);
    expect(tracksMock.resData.body.error).toContain('No autenticado');

    // 2. GET /api/sessions without cookie
    const sessionsMock = createMockHttp({ method: 'GET', url: '/api/sessions' });
    await sessionsHandler(sessionsMock.req, sessionsMock.res);
    expect(sessionsMock.resData.statusCode).toBe(401);

    // 3. POST /api/transitions without cookie
    const transMock = createMockHttp({
      method: 'POST',
      url: '/api/transitions',
      body: { session_id: 's1', source_track_id: 't1', target_track_id: 't2' },
    });
    await transitionsHandler(transMock.req, transMock.res);
    expect(transMock.resData.statusCode).toBe(401);
  });

  it('authenticates with correct password and sets session cookie', async () => {
    const loginMock = createMockHttp({
      method: 'POST',
      url: '/api/login',
      body: { password: 'test-secret-password' },
    });

    await loginHandler(loginMock.req, loginMock.res);
    expect(loginMock.resData.statusCode).toBe(200);
    expect(loginMock.resData.body.success).toBe(true);
    expect(loginMock.resData.headers['set-cookie']).toBeDefined();
    expect(loginMock.resData.headers['set-cookie']).toContain('vc_session=');
  });

  it('rejects incorrect password with 401', async () => {
    const loginMock = createMockHttp({
      method: 'POST',
      url: '/api/login',
      body: { password: 'wrong-password' },
    });

    await loginHandler(loginMock.req, loginMock.res);
    expect(loginMock.resData.statusCode).toBe(401);
    expect(loginMock.resData.body.error).toContain('Contraseña incorrecta');
  });

  // Mandatory Test 14: Duplicate transition prevention by double submit
  it('prevents duplicate transitions with the same idempotency token', async () => {
    const signedToken = signSession('user_1');
    const authCookie = `vc_session=${signedToken}`;

    const payload = {
      client_token: 'unique-idempotency-token-12345',
      session_id: 'session-repeat-test',
      source_track_id: 'track_a',
      source_artist: 'Artist A',
      source_track: 'Track A',
      target_track_id: 'track_b',
      target_artist: 'Artist B',
      target_track: 'Track B',
      transition_type: 'beatmatch',
      suggested_pitch_pct: 1.25,
      used_pitch_pct: 1.25,
      pitch_bend_pct: 0,
      rating: 5,
      notes: 'Gran mezcla',
      recommendation_reasons: ['BPM exacto'],
    };

    // First request: should succeed (201 Created)
    const firstCall = createMockHttp({
      method: 'POST',
      url: '/api/transitions',
      headers: { cookie: authCookie },
      body: payload,
    });
    await transitionsHandler(firstCall.req, firstCall.res);
    expect(firstCall.resData.statusCode).toBe(201);
    expect(firstCall.resData.body.success).toBe(true);

    // Second request with exact same client_token: should return 409 Conflict
    const secondCall = createMockHttp({
      method: 'POST',
      url: '/api/transitions',
      headers: { cookie: authCookie },
      body: payload,
    });
    await transitionsHandler(secondCall.req, secondCall.res);
    expect(secondCall.resData.statusCode).toBe(409);
    expect(secondCall.resData.body.duplicate).toBe(true);
    expect(secondCall.resData.body.error).toContain('ya fue registrada previamente');
  });

  // Mandatory Test 13: Practice session grouping & reading logic
  it('correctly parses, groups, and sorts transitions into practice sessions', () => {
    const mockLogs: TransitionLog[] = [
      {
        transition_id: 'tr_1',
        session_id: 'session_A',
        created_at: '2026-11-17T10:00:00.000Z',
        source_track_id: 't1',
        source_artist: 'Artist 1',
        source_album: 'Album 1',
        source_track: 'Track 1',
        target_track_id: 't2',
        target_artist: 'Artist 2',
        target_album: 'Album 2',
        target_track: 'Track 2',
        mode: 'precise',
        genre_filter: 'all',
        transition_type: 'beatmatch',
        suggested_pitch_pct: 0.5,
        used_pitch_pct: 0.5,
        pitch_bend_pct: null,
        rating: 4,
        notes: 'Smooth transition',
        recommendation_reasons: 'BPM cercano',
      },
      {
        transition_id: 'tr_2',
        session_id: 'session_A',
        created_at: '2026-11-17T10:08:00.000Z',
        source_track_id: 't2',
        source_artist: 'Artist 2',
        source_album: 'Album 2',
        source_track: 'Track 2',
        target_track_id: 't3',
        target_artist: 'Artist 3',
        target_album: 'Album 3',
        target_track: 'Track 3',
        mode: 'precise',
        genre_filter: 'all',
        transition_type: 'eq_mix',
        suggested_pitch_pct: -1.0,
        used_pitch_pct: -1.2,
        pitch_bend_pct: -0.5,
        rating: 5,
        notes: 'EQ cut on 16 bars',
        recommendation_reasons: 'Camelot exacto',
      },
      {
        transition_id: 'tr_3',
        session_id: 'session_B',
        created_at: '2026-11-17T12:00:00.000Z', // newer session
        source_track_id: 't4',
        source_artist: 'Artist 4',
        source_album: 'Album 4',
        source_track: 'Track 4',
        target_track_id: 't5',
        target_artist: 'Artist 5',
        target_album: 'Album 5',
        target_track: 'Track 5',
        mode: 'explore',
        genre_filter: 'same_genre',
        transition_type: 'cut',
        suggested_pitch_pct: 2.1,
        used_pitch_pct: 2.1,
        pitch_bend_pct: null,
        rating: 3,
        notes: 'Quick cut',
        recommendation_reasons: 'Cruce de género',
      },
    ];

    const sessions = groupTransitionsIntoSessions(mockLogs);

    // Expect 2 sessions
    expect(sessions.length).toBe(2);

    // Session B is newer (12:00 vs 10:08), so should be listed first
    expect(sessions[0].sessionId).toBe('session_B');
    expect(sessions[0].transitionsCount).toBe(1);
    expect(sessions[0].firstTrackName).toBe('Track 4');
    expect(sessions[0].lastTrackName).toBe('Track 5');

    // Session A has 2 transitions: Track 1 -> Track 2 -> Track 3
    expect(sessions[1].sessionId).toBe('session_A');
    expect(sessions[1].transitionsCount).toBe(2);
    expect(sessions[1].firstTrackName).toBe('Track 1');
    expect(sessions[1].lastTrackName).toBe('Track 3');
    expect(sessions[1].transitions[0].transition_id).toBe('tr_1');
    expect(sessions[1].transitions[1].transition_id).toBe('tr_2');
  });
});
