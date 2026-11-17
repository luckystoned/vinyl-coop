// api/tracks.ts
import { isRequestAuthenticated } from './_lib/auth';
import { getInventory } from './_lib/sheets';
import { sendJson } from './_lib/http';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  // Session verification
  const isAuth = isRequestAuthenticated(req.headers.cookie);
  if (!isAuth) {
    return sendJson(res, 401, { error: 'No autenticado. Por favor inicia sesión.' });
  }

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
    console.error('API /api/tracks error:', error);
    return sendJson(res, 500, { error: error.message || 'Error al obtener inventario' });
  }
}
