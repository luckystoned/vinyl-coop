// api/transitions.ts
import { isRequestAuthenticated } from './_lib/auth';
import { appendPracticeLog } from './_lib/sheets';
import { checkAndStoreToken } from './_lib/idempotency';
import { parseJsonBody, sendJson } from './_lib/http';
import { TransitionLog, CreateTransitionPayload } from '../src/types/practice';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  // Session verification
  const isAuth = isRequestAuthenticated(req.headers.cookie);
  if (!isAuth) {
    return sendJson(res, 401, { error: 'No autenticado. Por favor inicia sesión.' });
  }

  const payload: CreateTransitionPayload = await parseJsonBody(req);

  // Validate required fields
  if (!payload.session_id || !payload.source_track_id || !payload.target_track_id) {
    return sendJson(res, 400, { error: 'Faltan campos obligatorios de la transición' });
  }

  const clientToken = payload.client_token || `${payload.session_id}_${payload.source_track_id}_${payload.target_track_id}_${payload.used_pitch_pct}`;

  // Generate unique server transition_id
  const transitionId = `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Duplicate prevention check
  const idempotency = checkAndStoreToken(clientToken, transitionId);
  if (idempotency.duplicate) {
    return sendJson(res, 409, {
      error: 'Esta transición ya fue registrada previamente.',
      duplicate: true,
      existingId: idempotency.existingId,
    });
  }

  // Server generated timestamp
  const createdAt = new Date().toISOString();

  const transitionLog: TransitionLog = {
    transition_id: transitionId,
    session_id: payload.session_id.trim(),
    created_at: createdAt,
    source_track_id: payload.source_track_id,
    source_artist: payload.source_artist || '',
    source_album: payload.source_album || '',
    source_track: payload.source_track || '',
    target_track_id: payload.target_track_id,
    target_artist: payload.target_artist || '',
    target_album: payload.target_album || '',
    target_track: payload.target_track || '',
    mode: payload.mode || 'precise',
    genre_filter: payload.genre_filter || 'same_genre',
    transition_type: payload.transition_type || 'beatmatch',
    suggested_pitch_pct: typeof payload.suggested_pitch_pct === 'number' ? payload.suggested_pitch_pct : 0,
    used_pitch_pct: typeof payload.used_pitch_pct === 'number' ? payload.used_pitch_pct : 0,
    pitch_bend_pct: typeof payload.pitch_bend_pct === 'number' ? payload.pitch_bend_pct : null,
    rating: typeof payload.rating === 'number' && payload.rating >= 1 && payload.rating <= 5 ? payload.rating : null,
    notes: (payload.notes || '').trim(),
    recommendation_reasons: Array.isArray(payload.recommendation_reasons)
      ? payload.recommendation_reasons.join('; ')
      : (payload.recommendation_reasons || ''),
  };

  try {
    const { success, demoMode } = await appendPracticeLog(transitionLog);
    return sendJson(res, 201, {
      success,
      transition: transitionLog,
      demoMode,
    });
  } catch (error: any) {
    console.error('API /api/transitions write error:', error);
    return sendJson(res, 500, {
      error: error.message || 'Error al guardar la transición en Google Sheets',
    });
  }
}
