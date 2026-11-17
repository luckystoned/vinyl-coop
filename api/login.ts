// api/login.ts
import {
  checkRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
  createSessionCookie,
} from './_lib/auth';
import { isGoogleSheetsConfigured } from './_lib/sheets';
import { parseJsonBody, sendJson, getClientIp } from './_lib/http';

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
  const sheetConfigured = isGoogleSheetsConfigured();

  return sendJson(
    res,
    200,
    {
      success: true,
      sheetConfigured,
      demoMode: !sheetConfigured,
    },
    { 'Set-Cookie': cookie }
  );
}
