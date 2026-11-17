// api/sessions.ts
import { isRequestAuthenticated } from './_lib/auth.js';
import { getPracticeSessions } from './_lib/supabase.js';
import { sendJson } from './_lib/http.js';

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
    const { sessions, demoMode } = await getPracticeSessions();

    return sendJson(res, 200, {
      sessions,
      demoMode,
    });
  } catch (error: any) {
    console.error('API /api/sessions error:', error);
    return sendJson(res, 500, { error: error.message || 'Error al obtener historial' });
  }
}
