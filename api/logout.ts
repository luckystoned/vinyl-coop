// api/logout.ts
import { createLogoutCookie } from './_lib/auth';
import { sendJson } from './_lib/http';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  const cookie = createLogoutCookie();
  return sendJson(
    res,
    200,
    { success: true },
    { 'Set-Cookie': cookie }
  );
}
