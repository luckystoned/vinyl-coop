// api/_lib/normalization.ts
import type { Track, Genre } from '../../src/types/track';

/**
 * Creates a clean URL-safe slug for generating deterministic IDs.
 */
export function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a deterministic ID for a track.
 * Incorporates artist, album, track title, vinyl side, and occurrence counter.
 */
export function generateTrackId(
  artist: string,
  album: string,
  track: string,
  vinylSide: string,
  occurrence: number = 1
): string {
  const parts = [
    slugify(artist) || 'unknown-artist',
    slugify(album) || 'unknown-album',
    slugify(track) || 'unknown-track',
    slugify(vinylSide) || 'side',
  ];

  if (occurrence > 1) {
    parts.push(occurrence.toString());
  }

  return parts.join('__');
}

/**
 * Parses raw 2D row data or object array from Google Sheets "Vinyl Inventory".
 * Detects headers by name, handles missing or misordered columns,
 * ignores empty rows, and normalizes types.
 */
export function normalizeInventoryRows(rows: (string | undefined)[][]): Track[] {
  if (!rows || rows.length === 0) return [];

  // First non-empty row is treated as headers
  let headerRowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row && row.some(cell => cell && cell.toString().trim().length > 0)) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) return [];

  const headers = rows[headerRowIndex].map(h => (h ? h.toString().trim().toLowerCase() : ''));

  // Find column indices by header name
  const colIndex = {
    artist: headers.findIndex(h => h === 'artist'),
    album: headers.findIndex(h => h === 'album'),
    track: headers.findIndex(h => h === 'track' || h === 'title'),
    bpm: headers.findIndex(h => h === 'bpm'),
    key: headers.findIndex(h => h === 'key'),
    energy: headers.findIndex(h => h.startsWith('energy')),
    djUse: headers.findIndex(h => h === 'dj_use' || h === 'dj use'),
    vinylSide: headers.findIndex(h => h === 'vinyl_side' || h === 'vinyl side' || h === 'side'),
    camelotKey: headers.findIndex(h => h === 'camelot_key' || h === 'camelot key' || h === 'camelot'),
    tags: headers.findIndex(h => h === 'tags'),
    discoImg: headers.findIndex(h => h === 'disco img' || h === 'disco_img' || h === 'cover' || h === 'image'),
    genre: headers.findIndex(h => h === 'genre'),
  };

  const tracks: Track[] = [];
  const occurrenceTracker: Record<string, number> = {};

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const getVal = (idx: number): string => {
      if (idx === -1 || idx >= row.length) return '';
      const v = row[idx];
      return v !== undefined && v !== null ? v.toString().trim() : '';
    };

    const artist = getVal(colIndex.artist);
    const album = getVal(colIndex.album);
    const trackTitle = getVal(colIndex.track);

    // Skip row if it has no artist and no track title
    if (!artist && !trackTitle) continue;

    // Parse BPM
    const rawBpm = getVal(colIndex.bpm).replace(',', '.');
    const parsedBpm = rawBpm ? parseFloat(rawBpm) : NaN;
    const bpm = !isNaN(parsedBpm) && parsedBpm > 0 ? Math.round(parsedBpm * 100) / 100 : null;

    // Parse Energy (1-5)
    const rawEnergy = getVal(colIndex.energy);
    const parsedEnergy = rawEnergy ? parseInt(rawEnergy, 10) : NaN;
    const energy = !isNaN(parsedEnergy) && parsedEnergy >= 1 && parsedEnergy <= 5 ? parsedEnergy : null;

    // Key & Camelot
    const key = getVal(colIndex.key);
    const rawCamelot = getVal(colIndex.camelotKey);
    const camelotKey = rawCamelot ? rawCamelot.toUpperCase() : null;

    // Vinyl Side
    const vinylSide = getVal(colIndex.vinylSide);

    // DJ Use & Genre
    const djUse = getVal(colIndex.djUse);
    const genre = (getVal(colIndex.genre) as Genre) || 'Other';

    // Tags (split comma, semicolon or slash)
    const rawTags = getVal(colIndex.tags);
    const tags = rawTags
      ? rawTags
          .split(/[,;/]+/)
          .map(t => t.trim())
          .filter(Boolean)
      : [];

    // Cover Image URL
    const coverUrl = getVal(colIndex.discoImg) || null;

    // Disambiguate duplicate titles with occurrence tracker
    const signature = `${artist}__${album}__${trackTitle}__${vinylSide}`.toLowerCase();
    const occurrence = (occurrenceTracker[signature] || 0) + 1;
    occurrenceTracker[signature] = occurrence;

    const id = generateTrackId(artist, album, trackTitle, vinylSide, occurrence);

    tracks.push({
      id,
      artist: artist || 'Unknown Artist',
      album: album || 'Unknown Album',
      track: trackTitle || 'Untitled Track',
      bpm,
      key,
      camelotKey,
      energy,
      djUse,
      vinylSide,
      tags,
      coverUrl,
      genre,
    });
  }

  return tracks;
}
