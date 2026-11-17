// api/upload-cover.ts
import { isRequestAuthenticated } from './_lib/auth.js';
import { getSupabaseClient, isSupabaseConfigured } from './_lib/supabase.js';
import { parseJsonBody, sendJson } from './_lib/http.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  // Session verification
  const isAuth = isRequestAuthenticated(req.headers.cookie);
  if (!isAuth) {
    return sendJson(res, 401, { error: 'No autenticado. Por favor inicia sesión.' });
  }

  if (!isSupabaseConfigured()) {
    return sendJson(res, 500, { error: 'Supabase no está configurado.' });
  }

  try {
    const body = await parseJsonBody(req);
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return sendJson(res, 400, { error: 'Falta la imagen en base64.' });
    }

    // Convert base64 data to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    const filePath = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const supabase = getSupabaseClient();
    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(filePath, buffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage.from('covers').getPublicUrl(filePath);

    return sendJson(res, 200, {
      success: true,
      url: publicUrlData.publicUrl,
    });
  } catch (error: any) {
    console.error('Upload cover error:', error);
    return sendJson(res, 500, {
      error: error.message || 'Error al subir la carátula',
    });
  }
}
