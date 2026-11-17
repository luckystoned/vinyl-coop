// tests/pitch.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveBpm,
  calculateRequiredPitchPct,
  formatPitchPct,
  isPitchWithinTolerance,
  calculateBpmScore,
  calculateSemitoneDrift,
} from '../src/lib/bpm/pitch';

describe('BPM & Pitch Calculations', () => {
  // Mandatory Test 1: Positive and negative pitch calculation
  it('calculates positive and negative pitch adjustments correctly', () => {
    // Current track at 130 BPM, candidate at 132 BPM
    // Candidate needs to slow down to match 130: (130 / 132 - 1) * 100 = -1.515%
    const negativePitch = calculateRequiredPitchPct(130, 132);
    expect(negativePitch).toBeCloseTo(-1.515, 2);
    expect(formatPitchPct(negativePitch)).toBe('-1.52%');

    // Current track at 132 BPM, candidate at 130 BPM
    // Candidate needs to speed up to match 132: (132 / 130 - 1) * 100 = +1.538%
    const positivePitch = calculateRequiredPitchPct(132, 130);
    expect(positivePitch).toBeCloseTo(1.538, 2);
    expect(formatPitchPct(positivePitch)).toBe('+1.54%');

    // Exactly matching BPM
    const zeroPitch = calculateRequiredPitchPct(128, 128);
    expect(zeroPitch).toBe(0);
    expect(formatPitchPct(zeroPitch)).toBe('+0.00%');
  });

  // Mandatory Test 2: Effective BPM when current track has pitch applied
  it('calculates effective BPM when Deck A has pitch applied', () => {
    // Base BPM 130 with +2.0% pitch on Deck A fader
    // 130 * 1.02 = 132.6 BPM
    const effectiveBpm = calculateEffectiveBpm(130, 2.0);
    expect(effectiveBpm).toBeCloseTo(132.6, 2);

    // Negative pitch on Deck A: 130 with -1.5% pitch -> 130 * 0.985 = 128.05 BPM
    const effectiveBpmNegative = calculateEffectiveBpm(130, -1.5);
    expect(effectiveBpmNegative).toBeCloseTo(128.05, 2);

    // Now candidate at 133 BPM trying to match Deck A at 132.6 BPM
    const reqPitch = calculateRequiredPitchPct(effectiveBpm, 133);
    // (132.6 / 133 - 1) * 100 = -0.30%
    expect(reqPitch).toBeCloseTo(-0.30, 2);
  });

  // Mandatory Test 3: Pitch tolerance limits ±3%, ±6%, and ±8%
  it('enforces tolerance limits of ±3%, ±6%, and ±8%', () => {
    // Precise mode default: ±3%
    expect(isPitchWithinTolerance(2.9, 3.0)).toBe(true);
    expect(isPitchWithinTolerance(-3.0, 3.0)).toBe(true);
    expect(isPitchWithinTolerance(3.05, 3.0)).toBe(false);
    expect(isPitchWithinTolerance(-3.1, 3.0)).toBe(false);

    // Explore mode default: ±6%
    expect(isPitchWithinTolerance(5.9, 6.0)).toBe(true);
    expect(isPitchWithinTolerance(-6.0, 6.0)).toBe(true);
    expect(isPitchWithinTolerance(6.01, 6.0)).toBe(false);

    // Manual slider max: ±8%
    expect(isPitchWithinTolerance(7.99, 8.0)).toBe(true);
    expect(isPitchWithinTolerance(-8.0, 8.0)).toBe(true);
    expect(isPitchWithinTolerance(8.05, 8.0)).toBe(false);

    // Score is 0 when exceeding tolerance
    expect(calculateBpmScore(3.5, 3.0, 'precise')).toBe(0);
    expect(calculateBpmScore(0, 3.0, 'precise')).toBe(100);
  });

  it('calculates vinyl semitone drift from pitch adjustment', () => {
    // ~5.95% pitch shift is ~1 semitone
    const semitonesAt6Pct = calculateSemitoneDrift(5.95);
    expect(semitonesAt6Pct).toBeCloseTo(1.0, 1);

    const semitonesAtMinus6Pct = calculateSemitoneDrift(-5.61);
    expect(semitonesAtMinus6Pct).toBeCloseTo(-1.0, 1);
  });
});
