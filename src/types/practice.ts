// src/types/practice.ts

export type TransitionType = 'beatmatch' | 'eq_mix' | 'cut' | 'other';

export interface TransitionLog {
  transition_id: string;
  session_id: string;
  created_at: string; // ISO 8601 string
  source_track_id: string;
  source_artist: string;
  source_album: string;
  source_track: string;
  target_track_id: string;
  target_artist: string;
  target_album: string;
  target_track: string;
  mode: string; // 'precise' | 'explore'
  genre_filter: string; // 'same_genre' | 'techno_only' | 'all'
  transition_type: TransitionType;
  suggested_pitch_pct: number;
  used_pitch_pct: number;
  pitch_bend_pct: number | null;
  rating: number | null; // 1 to 5
  notes: string;
  recommendation_reasons: string; // JSON or semicolon separated string
}

export interface PracticeSession {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  transitionsCount: number;
  firstTrackName: string;
  lastTrackName: string;
  transitions: TransitionLog[];
}

export interface CreateTransitionPayload {
  client_token: string; // Idempotency token to prevent duplicate saves
  session_id: string;
  source_track_id: string;
  source_artist: string;
  source_album: string;
  source_track: string;
  target_track_id: string;
  target_artist: string;
  target_album: string;
  target_track: string;
  mode: string;
  genre_filter: string;
  transition_type: TransitionType;
  suggested_pitch_pct: number;
  used_pitch_pct: number;
  pitch_bend_pct: number | null;
  rating: number | null;
  notes: string;
  recommendation_reasons: string[];
}
