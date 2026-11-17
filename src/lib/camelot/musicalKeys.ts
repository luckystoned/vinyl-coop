// src/lib/camelot/musicalKeys.ts

export interface KeyOption {
  key: string;
  camelot: string;
}

export const MUSICAL_KEYS: KeyOption[] = [
  // Minor (A)
  { key: 'Abm', camelot: '1A' },
  { key: 'G#m', camelot: '1A' },
  { key: 'Ebm', camelot: '2A' },
  { key: 'D#m', camelot: '2A' },
  { key: 'Bbm', camelot: '3A' },
  { key: 'A#m', camelot: '3A' },
  { key: 'Fm', camelot: '4A' },
  { key: 'Cm', camelot: '5A' },
  { key: 'Gm', camelot: '6A' },
  { key: 'Dm', camelot: '7A' },
  { key: 'Am', camelot: '8A' },
  { key: 'Em', camelot: '9A' },
  { key: 'Bm', camelot: '10A' },
  { key: 'F#m', camelot: '11A' },
  { key: 'Gbm', camelot: '11A' },
  { key: 'C#m', camelot: '12A' },
  { key: 'Dbm', camelot: '12A' },

  // Major (B)
  { key: 'B', camelot: '1B' },
  { key: 'F#', camelot: '2B' },
  { key: 'Gb', camelot: '2B' },
  { key: 'Db', camelot: '3B' },
  { key: 'C#', camelot: '3B' },
  { key: 'Ab', camelot: '4B' },
  { key: 'G#', camelot: '4B' },
  { key: 'Eb', camelot: '5B' },
  { key: 'D#', camelot: '5B' },
  { key: 'Bb', camelot: '6B' },
  { key: 'A#', camelot: '6B' },
  { key: 'F', camelot: '7B' },
  { key: 'C', camelot: '8B' },
  { key: 'G', camelot: '9B' },
  { key: 'D', camelot: '10B' },
  { key: 'A', camelot: '11B' },
  { key: 'E', camelot: '12B' },
];

export function keyToCamelot(keyStr: string): string | null {
  if (!keyStr) return null;
  const clean = keyStr.trim().replace(/\s+/g, '');
  const match = MUSICAL_KEYS.find(
    (k) => k.key.toLowerCase() === clean.toLowerCase()
  );
  if (match) return match.camelot;

  // If already in camelot format (e.g. "8A", "11B")
  const camelotMatch = clean.toUpperCase().match(/^(\d{1,2})([AB])$/);
  if (camelotMatch) {
    const num = parseInt(camelotMatch[1], 10);
    if (num >= 1 && num <= 12) return `${num}${camelotMatch[2]}`;
  }

  return null;
}
