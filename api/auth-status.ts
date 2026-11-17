// api/auth-status.ts
import { isRequestAuthenticated } from './_lib/auth.js';
import { isSupabaseConfigured } from './_lib/supabase.js';
import { sendJson } from './_lib/http.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  const authenticated = isRequestAuthenticated(req.headers.cookie);
  const databaseConfigured = isSupabaseConfigured();

  return sendJson(res, 200, {
    authenticated,
    sheetConfigured: databaseConfigured,
    demoMode: !databaseConfigured,
  });
}
