// src/lib/recommendations/engine.ts
import { Track } from '../../types/track';
import {
  RecommendationOptions,
  RecommendationResult,
  RecommendationEngineOutput,
} from '../../types/recommendation';
import {
  calculateEffectiveBpm,
  calculateRequiredPitchPct,
  formatPitchPct,
  isPitchWithinTolerance,
  calculateBpmScore,
} from '../bpm/pitch';
import { calculateCamelotCompatibility } from '../camelot/wheel';
import { calculateGenreCompatibility } from '../genre/affinity';

/**
 * Checks if candidate is from the same physical vinyl/album.
 * Conservative exclusion by album to ensure the user isn't asked to mix a track
 * from the record currently playing on their turntable.
 */
export function isSameVinylOrTrack(currentTrack: Track, candidate: Track): boolean {
  if (currentTrack.id === candidate.id) return true;

  const currentAlbum = currentTrack.album?.trim().toLowerCase();
  const candidateAlbum = candidate.album?.trim().toLowerCase();

  // If albums are known and match, exclude (same vinyl)
  if (currentAlbum && candidateAlbum && currentAlbum === candidateAlbum) {
    return true;
  }

  return false;
}

/**
 * Calculate energy score based on mode.
 */
function calculateEnergyScore(
  currentEnergy: number | null,
  candidateEnergy: number | null,
  mode: 'precise' | 'explore'
): { score: number; reason: string } | null {
  if (currentEnergy === null || candidateEnergy === null) {
    return null;
  }

  const diff = Math.abs(currentEnergy - candidateEnergy);

  if (mode === 'precise') {
    if (diff === 0) return { score: 100, reason: `Mismo nivel de energía (${candidateEnergy}/5)` };
    if (diff === 1) return { score: 80, reason: `Energía muy cercana (${candidateEnergy}/5 vs ${currentEnergy}/5)` };
    if (diff === 2) return { score: 40, reason: `Cambio moderado de energía (${candidateEnergy}/5)` };
    return { score: 10, reason: `Salto brusco de energía (${candidateEnergy}/5 vs ${currentEnergy}/5)` };
  } else {
    // Explore mode favors intentional shifts
    if (diff === 0) return { score: 85, reason: `Mantiene la energía (${candidateEnergy}/5)` };
    if (diff === 1) return { score: 95, reason: `Transición fluida de energía (${candidateEnergy}/5)` };
    if (diff === 2) return { score: 80, reason: `Contraste dinámico de energía (${candidateEnergy}/5)` };
    if (diff === 3) return { score: 65, reason: `Cambio marcado de intensidad (${candidateEnergy}/5)` };
    return { score: 40, reason: `Contraste extremo de energía (${candidateEnergy}/5)` };
  }
}

/**
 * Calculates a deterministic exploration / novelty score for Explore mode.
 * Rewards unexpected but musically coherent combinations without randomness.
 */
function calculateExplorationScore(
  currentTrack: Track,
  candidate: Track,
  camelotDiff: number
): { score: number; reason?: string } {
  let score = 50; // baseline
  const reasons: string[] = [];

  // Genre crossover with tag affinity
  if (currentTrack.genre !== candidate.genre) {
    score += 20;
    reasons.push(`Cruce de género (${currentTrack.genre} → ${candidate.genre})`);
  }

  // Energy contrast
  if (currentTrack.energy !== null && candidate.energy !== null) {
    const energyDiff = Math.abs(currentTrack.energy - candidate.energy);
    if (energyDiff >= 1 && energyDiff <= 2) {
      score += 15;
    }
  }

  // Camelot relative or neighbor
  if (camelotDiff === 1) {
    score += 15;
  }

  const finalScore = Math.min(100, Math.max(0, score));
  return {
    score: finalScore,
    reason: reasons[0],
  };
}

/**
 * Primary recommendation engine.
 * Pure deterministic function to score and rank candidates against the current track.
 */
export function getRecommendations(
  currentTrack: Track,
  inventory: Track[],
  options: RecommendationOptions
): RecommendationEngineOutput {
  const { mode, genreFilter, pitchTolerancePct, currentPitchPct } = options;

  const currentEffectiveBpm = calculateEffectiveBpm(currentTrack.bpm ?? 0, currentPitchPct);
  const rankedRecommendations: RecommendationResult[] = [];
  const incompleteDataAlternatives: Track[] = [];

  for (const candidate of inventory) {
    // 1. Exclude same track or same vinyl/album
    if (isSameVinylOrTrack(currentTrack, candidate)) {
      continue;
    }

    // 2. Genre filter checks
    if (genreFilter === 'techno_only') {
      if ((candidate.genre || '').trim().toLowerCase() !== 'techno') {
        continue;
      }
    }

    // 3. Handle missing BPM
    if (candidate.bpm === null || candidate.bpm <= 0 || currentTrack.bpm === null || currentTrack.bpm <= 0) {
      incompleteDataAlternatives.push(candidate);
      continue;
    }

    // 4. Calculate required pitch
    const requiredPitchPct = calculateRequiredPitchPct(currentEffectiveBpm, candidate.bpm);

    // 5. Strict Pitch Tolerance Filter
    if (!isPitchWithinTolerance(requiredPitchPct, pitchTolerancePct)) {
      // Check half-time / double-time as experimental possibilities
      // Do NOT recommend automatically as regular mix
      continue;
    }

    const candidateEffectiveBpm = calculateEffectiveBpm(candidate.bpm, requiredPitchPct);

    // 6. Calculate individual criterion scores
    const reasons: string[] = [];
    const warnings: string[] = [];
    let isPartial = false;

    // BPM Score
    const bpmScore = calculateBpmScore(requiredPitchPct, pitchTolerancePct, mode);
    reasons.push(`Pitch necesario: ${formatPitchPct(requiredPitchPct)} (BPM: ${candidate.bpm})`);

    // Camelot Score
    const camelotResult = calculateCamelotCompatibility(
      currentTrack.camelotKey,
      candidate.camelotKey,
      mode,
      requiredPitchPct
    );
    let camelotScore = 0;
    if (camelotResult) {
      camelotScore = camelotResult.score;
      if (camelotResult.description) {
        reasons.push(camelotResult.description);
      }
      if (camelotResult.harmonicWarning) {
        warnings.push(camelotResult.harmonicWarning);
      }
    } else {
      isPartial = true;
    }

    // Genre Score
    let genreScoreResult = calculateGenreCompatibility(
      currentTrack.genre,
      candidate.genre,
      currentTrack.tags,
      candidate.tags
    );

    // If same_genre filter selected, boost affinity for same genre
    let genreScore = genreScoreResult.score;
    if (genreFilter === 'same_genre') {
      if ((candidate.genre || '').toLowerCase() === (currentTrack.genre || '').toLowerCase()) {
        genreScore = Math.min(100, genreScore + 10);
      } else {
        // slightly de-prioritize different genres
        genreScore = Math.max(0, genreScore - 15);
      }
    }

    if (genreScoreResult.reason) {
      reasons.push(genreScoreResult.reason);
    }

    // Energy Score
    const energyResult = calculateEnergyScore(currentTrack.energy, candidate.energy, mode);
    let energyScore = 0;
    if (energyResult) {
      energyScore = energyResult.score;
      reasons.push(energyResult.reason);
    } else {
      isPartial = true;
    }

    // Exploration Score (in explore mode)
    let explorationScore = 0;
    if (mode === 'explore') {
      const expRes = calculateExplorationScore(
        currentTrack,
        candidate,
        camelotResult ? 1 : 0
      );
      explorationScore = expRes.score;
      if (expRes.reason) {
        reasons.push(expRes.reason);
      }
    }

    // 7. Dynamic Weight Distribution & Missing Data Reweighting
    // Base Weights:
    // Precise: BPM 40%, Camelot 25%, Genre 25%, Energy 10%
    // Explore: BPM 35%, Camelot 15%, Genre 20%, Energy 15%, Explore 15%
    let totalAvailableWeight = 0;
    let weightedSum = 0;

    const baseWeights = mode === 'precise'
      ? { bpm: 40, camelot: 25, genre: 25, energy: 10, explore: 0 }
      : { bpm: 35, camelot: 15, genre: 20, energy: 15, explore: 15 };

    // BPM is always present for ranked candidates
    totalAvailableWeight += baseWeights.bpm;
    weightedSum += bpmScore * baseWeights.bpm;

    // Camelot
    if (camelotResult !== null) {
      totalAvailableWeight += baseWeights.camelot;
      weightedSum += camelotScore * baseWeights.camelot;
    }

    // Genre
    totalAvailableWeight += baseWeights.genre;
    weightedSum += genreScore * baseWeights.genre;

    // Energy
    if (energyResult !== null) {
      totalAvailableWeight += baseWeights.energy;
      weightedSum += energyScore * baseWeights.energy;
    }

    // Explore
    if (mode === 'explore') {
      totalAvailableWeight += baseWeights.explore;
      weightedSum += explorationScore * baseWeights.explore;
    }

    // Reweighted final score normalized to 0 - 100
    const overallScore = totalAvailableWeight > 0
      ? Math.round(weightedSum / totalAvailableWeight)
      : 0;

    if (isPartial) {
      warnings.push('Recomendación basada en información parcial del track');
    }

    rankedRecommendations.push({
      track: candidate,
      overallScore,
      requiredPitchPct: Math.round(requiredPitchPct * 100) / 100,
      effectiveBpmCandidate: Math.round(candidateEffectiveBpm * 100) / 100,
      breakdown: {
        bpmScore,
        camelotScore,
        genreScore,
        energyScore,
        explorationScore: mode === 'explore' ? explorationScore : undefined,
      },
      reasons,
      warnings,
      isPartial,
    });
  }

  // Sort descending by overallScore, then by requiredPitchPct proximity to 0
  rankedRecommendations.sort((a, b) => {
    if (b.overallScore !== a.overallScore) {
      return b.overallScore - a.overallScore;
    }
    return Math.abs(a.requiredPitchPct) - Math.abs(b.requiredPitchPct);
  });

  return {
    rankedRecommendations,
    incompleteDataAlternatives,
  };
}
