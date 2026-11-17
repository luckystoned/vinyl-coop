// api/tracks.ts
import { isRequestAuthenticated } from './_lib/auth.js';
import { getInventory, saveTrack, deleteTrack } from './_lib/supabase.js';
import { parseJsonBody, sendJson } from './_lib/http.js';
import type { Track } from '../src/types/track';

export default async function handler(req: any, res: any) {
  // Session verification
  const isAuth = isRequestAuthenticated(req.headers.cookie);
  if (!isAuth) {
    return sendJson(res, 401, { error: 'No autenticado. Por favor inicia sesión.' });
  }

  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const forceRefresh = url.searchParams.get('refresh') === 'true';

      const { tracks, demoMode } = await getInventory(forceRefresh);

      return sendJson(res, 200, {
        tracks,
        count: tracks.length,
        demoMode,
      });
    } catch (error: any) {
      console.error('API /api/tracks GET error:', error);
      return sendJson(res, 500, { error: error.message || 'Error al obtener inventario' });
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const track: Track = await parseJsonBody(req);
      if (!track.id || !track.artist || !track.track) {
        return sendJson(res, 400, { error: 'Faltan campos obligatorios (id, artist, track).' });
      }

      const result = await saveTrack(track);
      return sendJson(res, 200, result);
    } catch (error: any) {
      console.error('API /api/tracks POST/PUT error:', error);
      return sendJson(res, 500, { error: error.message || 'Error al guardar track' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const id = url.searchParams.get('id');
      if (!id) {
        return sendJson(res, 400, { error: 'Falta el id del track a eliminar' });
      }

      const result = await deleteTrack(id);
      return sendJson(res, 200, result);
    } catch (error: any) {
      console.error('API /api/tracks DELETE error:', error);
      return sendJson(res, 500, { error: error.message || 'Error al eliminar track' });
    }
  }

  return sendJson(res, 405, { error: 'Method Not Allowed' });
}
