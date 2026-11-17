// api/login.ts
import {
  checkRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
  createSessionCookie,
} from './_lib/auth.js';
import { isSupabaseConfigured } from './_lib/supabase.js';
import { parseJsonBody, sendJson, getClientIp } from './_lib/http.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return sendJson(res, 429, {
      error: `Demasiados intentos fallidos. Por favor espera ${rateLimit.remainingSec} segundos.`,
    });
  }

  const body = await parseJsonBody(req);
  const password = body.password?.trim();

  const configuredPassword = process.env.APP_PASSWORD || 'vinylcoop';

  if (!password || password !== configuredPassword) {
    recordLoginFailure(ip);
    return sendJson(res, 401, { error: 'Contraseña incorrecta' });
  }

  recordLoginSuccess(ip);
  const cookie = createSessionCookie();
  const databaseConfigured = isSupabaseConfigured();

  return sendJson(
    res,
    200,
    {
      success: true,
      sheetConfigured: databaseConfigured,
      demoMode: !databaseConfigured,
    },
    { 'Set-Cookie': cookie }
  );
}
