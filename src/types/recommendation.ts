// src/types/recommendation.ts
import { Track } from './track';

export type RecommendationMode = 'precise' | 'explore'; // "Mezcla precisa" vs "Explorar"

export type GenreFilter = 'same_genre' | 'techno_only' | 'all';

export interface RecommendationOptions {
  mode: RecommendationMode;
  genreFilter: GenreFilter;
  pitchTolerancePct: number; // e.g. 3.0, 6.0, 8.0
  currentPitchPct: number; // Current pitch on deck A (fader), default 0.0
}

export interface CompatibilityScoreBreakdown {
  bpmScore: number; // 0 - 100
  camelotScore: number; // 0 - 100
  genreScore: number; // 0 - 100
  energyScore: number; // 0 - 100
  explorationScore?: number; // 0 - 100 (in explore mode)
}

export interface RecommendationResult {
  track: Track;
  overallScore: number; // 0 - 100
  requiredPitchPct: number; // signed % to match candidate to current effective BPM
  effectiveBpmCandidate: number;
  breakdown: CompatibilityScoreBreakdown;
  reasons: string[]; // Explanations e.g. ["BPM muy cercano (+0.50%)", "Misma clave Camelot (8A)", ...]
  warnings: string[]; // e.g. ["Pitch alto afecta tonalidad armónica (~1 semitono)"]
  isPartial: boolean; // true if missing key or energy
  isExperimentalTempo?: boolean; // if half/double time detected
}

export interface RecommendationEngineOutput {
  rankedRecommendations: RecommendationResult[];
  incompleteDataAlternatives: Track[]; // Candidates with missing BPM or unusable data
}
