// api/sync-sheets.ts
import { isRequestAuthenticated } from './_lib/auth.js';
import { getInventory as getSheetsInventory, isGoogleSheetsConfigured } from './_lib/sheets.js';
import { getSupabaseClient, isSupabaseConfigured } from './_lib/supabase.js';
import { sendJson } from './_lib/http.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  // Session verification
  const isAuth = isRequestAuthenticated(req.headers.cookie);
  if (!isAuth) {
    return sendJson(res, 401, { error: 'No autenticado. Por favor inicia sesión.' });
  }

  if (!isGoogleSheetsConfigured()) {
    return sendJson(res, 400, { error: 'Google Sheets no está configurado.' });
  }

  if (!isSupabaseConfigured()) {
    return sendJson(res, 400, { error: 'Supabase no está configurado.' });
  }

  try {
    // 1. Fetch fresh inventory from Google Sheets
    const { tracks: sheetTracks } = await getSheetsInventory(true);

    if (!sheetTracks || sheetTracks.length === 0) {
      return sendJson(res, 200, {
        success: true,
        message: 'No se encontraron tracks en la planilla de Google Sheets.',
        importedCount: 0,
      });
    }

    // 2. Prepare DB records
    const dbRecords = sheetTracks.map((t) => ({
      id: t.id,
      artist: t.artist,
      album: t.album,
      track: t.track,
      bpm: t.bpm,
      key: t.key || null,
      camelot_key: t.camelotKey || null,
      energy: t.energy,
      dj_use: t.djUse || '',
      vinyl_side: t.vinylSide || '',
      tags: t.tags || [],
      cover_url: t.coverUrl || null,
      genre: t.genre || 'Other',
    }));

    // 3. Upsert into Supabase in batches of 100
    const supabase = getSupabaseClient();
    for (let i = 0; i < dbRecords.length; i += 100) {
      const batch = dbRecords.slice(i, i + 100);
      const { error } = await supabase.from('tracks').upsert(batch);
      if (error) {
        throw error;
      }
    }

    return sendJson(res, 200, {
      success: true,
      message: `Se importaron y actualizaron exitosamente ${dbRecords.length} tracks desde Google Sheets.`,
      importedCount: dbRecords.length,
    });
  } catch (error: any) {
    console.error('Error sync-sheets:', error);
    return sendJson(res, 500, {
      error: error.message || 'Error al sincronizar con Google Sheets',
    });
  }
}
