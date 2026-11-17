// src/types/catalog.ts
import { Track } from './track';
import { TransitionLog } from './practice';

export interface AlbumRelease {
  id: string; // artist_album slug
  album: string;
  artist: string;
  coverUrl: string | null;
  genres: string[];
  sides: {
    side: string;
    tracks: Track[];
  }[];
  totalTracks: number;
}

export interface TrackPracticeHistory {
  asSource: TransitionLog[];
  asTarget: TransitionLog[];
  totalCount: number;
}
