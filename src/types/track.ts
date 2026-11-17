// src/types/track.ts

export type Genre =
  | 'Techno'
  | 'House'
  | 'Electro'
  | 'Breaks / UK Bass'
  | 'IDM / Experimental'
  | 'Ambient / Downtempo'
  | 'Disco / Indie Dance'
  | 'Rock'
  | 'Pop'
  | 'Soul / R&B'
  | 'Hip-Hop'
  | 'Jazz / Fusion'
  | 'Folk'
  | 'Other';

export interface RawTrackRow {
  [key: string]: string | undefined;
}

export interface Track {
  id: string; // Deterministic ID e.g. "artist-album-track-side-occ"
  artist: string;
  album: string;
  track: string;
  bpm: number | null;
  key: string; // Musical key e.g. "Am", "F#m" or raw string
  camelotKey: string | null; // e.g. "8A", "11B"
  energy: number | null; // 1 to 5
  djUse: string;
  vinylSide: string; // e.g. "A", "B", "A1", "B2"
  tags: string[];
  coverUrl: string | null;
  genre: Genre | string;
}

export type CamelotMode = 'A' | 'B'; // A = Minor, B = Major

export interface ParsedCamelot {
  number: number; // 1 to 12
  mode: CamelotMode;
  raw: string;
}
