// src/lib/bpm/pitch.ts

/**
 * Calculates the current effective BPM of the playing track given its base BPM
 * and the current pitch fader position on Deck A.
 *
 * currentEffectiveBpm = currentBpm * (1 + currentPitchPct / 100)
 */
export function calculateEffectiveBpm(currentBpm: number, currentPitchPct: number = 0): number {
  if (currentBpm <= 0) return 0;
  return currentBpm * (1 + currentPitchPct / 100);
}

/**
 * Calculates the required pitch percentage for the candidate track
 * on Deck B to match the playing track's effective BPM.
 *
 * requiredPitchPct = (currentEffectiveBpm / candidateBpm - 1) * 100
 */
export function calculateRequiredPitchPct(
  currentEffectiveBpm: number,
  candidateBpm: number
): number {
  if (currentEffectiveBpm <= 0 || candidateBpm <= 0) return 0;
  return ((currentEffectiveBpm / candidateBpm) - 1) * 100;
}

/**
 * Formats a pitch percentage with sign (+ or -) and exactly 2 decimal places.
 * Example: +1.25%, -0.80%, +0.00%
 */
export function formatPitchPct(pitchPct: number): string {
  const rounded = Math.round(pitchPct * 100) / 100;
  // Avoid -0.00
  const normalized = Math.abs(rounded) < 0.001 ? 0 : rounded;
  const sign = normalized >= 0 ? '+' : '';
  return `${sign}${normalized.toFixed(2)}%`;
}

/**
 * Checks whether a required pitch percentage falls within the allowed tolerance limit.
 */
export function isPitchWithinTolerance(requiredPitchPct: number, tolerancePct: number): boolean {
  return Math.abs(requiredPitchPct) <= tolerancePct + 0.0001;
}

/**
 * Calculates approximate musical semitone shift caused by vinyl speed adjustment.
 * In analog vinyl without digital key lock, speed changes frequency:
 * semitones = 12 * log2(1 + pitchPct / 100)
 */
export function calculateSemitoneDrift(pitchPct: number): number {
  const ratio = 1 + pitchPct / 100;
  if (ratio <= 0) return 0;
  return 12 * (Math.log(ratio) / Math.LN2);
}

/**
 * Computes a score from 0 to 100 based on pitch difference and tolerance.
 * Closer to 0% pitch adjustment gets higher score.
 */
export function calculateBpmScore(
  requiredPitchPct: number,
  tolerancePct: number,
  mode: 'precise' | 'explore' = 'precise'
): number {
  const absPitch = Math.abs(requiredPitchPct);
  if (absPitch > tolerancePct) {
    return 0;
  }

  // Linear decay within tolerance
  // In precise mode, drops off faster after 1.5%
  if (mode === 'precise') {
    const ratio = absPitch / tolerancePct; // 0 (best) to 1 (at limit)
    // Quadratic ease-out for tighter scoring around 0
    return Math.max(0, Math.round(100 * (1 - Math.pow(ratio, 1.3))));
  } else {
    // Explore mode: gentler slope
    const ratio = absPitch / tolerancePct;
    return Math.max(0, Math.round(100 * (1 - ratio * 0.85)));
  }
}
