// src/lib/camelot/wheel.ts
import { ParsedCamelot, CamelotMode } from '../../types/track';
import { calculateSemitoneDrift } from '../bpm/pitch';

/**
 * Parses a Camelot key string (e.g. "8A", "11b", " 4A ") into its number and mode.
 * Returns null if invalid or missing.
 */
export function parseCamelotKey(keyStr: string | null | undefined): ParsedCamelot | null {
  if (!keyStr) return null;
  const trimmed = keyStr.trim().toUpperCase();
  const match = trimmed.match(/^(\d{1,2})\s*([AB])$/);
  if (!match) return null;

  const num = parseInt(match[1], 10);
  const mode = match[2] as CamelotMode;

  if (num < 1 || num > 12) return null;

  return {
    number: num,
    mode,
    raw: `${num}${mode}`,
  };
}

/**
 * Calculates the shortest distance around the 1-12 Camelot circle.
 * Distance between 12 and 1 is 1.
 * Distance between 11 and 1 is 2.
 */
export function getCamelotCircularDistance(numA: number, numB: number): number {
  const direct = Math.abs(numA - numB);
  return Math.min(direct, 12 - direct);
}

export type HarmonicRelationType =
  | 'exact' // Same key (e.g. 8A -> 8A)
  | 'adjacent' // +/- 1 same mode (e.g. 8A -> 7A, 9A, or 12A <-> 1A)
  | 'relative' // Same number, opposite mode (e.g. 8A -> 8B)
  | 'diagonal' // +/- 1 opposite mode (e.g. 8A -> 7B, 9B)
  | 'energy_boost' // +2 same mode (e.g. 8A -> 10A)
  | 'clash'; // Distant or incompatible

export interface CamelotCompatibility {
  score: number; // 0 to 100
  relation: HarmonicRelationType;
  description: string;
  harmonicWarning?: string;
}

/**
 * Calculates Camelot compatibility between two Camelot keys,
 * taking into account mode (precise vs explore) and vinyl pitch drift.
 */
export function calculateCamelotCompatibility(
  sourceKeyStr: string | null | undefined,
  targetKeyStr: string | null | undefined,
  mode: 'precise' | 'explore' = 'precise',
  requiredPitchPct: number = 0
): CamelotCompatibility | null {
  const source = parseCamelotKey(sourceKeyStr);
  const target = parseCamelotKey(targetKeyStr);

  if (!source || !target) {
    return null; // Missing data handled by reweighting
  }

  const numberDistance = getCamelotCircularDistance(source.number, target.number);
  const sameMode = source.mode === target.mode;

  let baseScore = 0;
  let relation: HarmonicRelationType = 'clash';
  let description = '';

  if (numberDistance === 0 && sameMode) {
    // Exact match (e.g. 8A -> 8A)
    baseScore = 100;
    relation = 'exact';
    description = `Misma tonalidad Camelot (${target.raw})`;
  } else if (numberDistance === 1 && sameMode) {
    // Adjacent key (+/- 1 same mode)
    baseScore = 90;
    relation = 'adjacent';
    const direction = (target.number === 1 && source.number === 12)
      ? '+1'
      : (target.number === 12 && source.number === 1)
      ? '-1'
      : target.number > source.number ? '+1' : '-1';
    description = `Tonalidad vecina (${direction} paso Camelot: ${target.raw})`;
  } else if (numberDistance === 0 && !sameMode) {
    // Relative Major / Minor (same number, A <-> B)
    baseScore = 85;
    relation = 'relative';
    const relType = target.mode === 'B' ? 'mayor relativa' : 'menor relativa';
    description = `Escala ${relType} (${target.raw})`;
  } else if (numberDistance === 1 && !sameMode) {
    // Diagonal mix (+/- 1 opposite mode)
    if (mode === 'explore') {
      baseScore = 60;
      relation = 'diagonal';
      description = `Cruce diagonal (${target.raw})`;
    } else {
      baseScore = 20;
      relation = 'clash';
      description = `Tonalidad distante para mezcla precisa (${target.raw})`;
    }
  } else if (numberDistance === 2 && sameMode) {
    // Energy boost (+2 steps)
    if (mode === 'explore') {
      baseScore = 55;
      relation = 'energy_boost';
      description = `Salto armónico / subida de energía (+2: ${target.raw})`;
    } else {
      baseScore = 15;
      relation = 'clash';
      description = `Salto armónico de 2 pasos (${target.raw})`;
    }
  } else {
    // Distant
    if (mode === 'explore') {
      // Small exploratory score
      baseScore = Math.max(5, 30 - numberDistance * 5);
      relation = 'clash';
      description = `Tonalidad distante (${target.raw}, dist. ${numberDistance})`;
    } else {
      baseScore = 0;
      relation = 'clash';
      description = `Tonalidades incompatibles (${source.raw} vs ${target.raw})`;
    }
  }

  // Physical Vinyl Consideration:
  // If required pitch shift is noticeable (|pitch| >= 3.0%), pitch fader alters vinyl playback frequency
  let harmonicWarning: string | undefined;
  let finalScore = baseScore;

  const semitoneDrift = calculateSemitoneDrift(requiredPitchPct);
  const absSemitones = Math.abs(semitoneDrift);

  if (absSemitones >= 0.5) {
    // Half a semitone or more of musical pitch shift
    const driftStr = (semitoneDrift >= 0 ? '+' : '') + semitoneDrift.toFixed(1);
    harmonicWarning = `Pitch analógico de ${requiredPitchPct >= 0 ? '+' : ''}${requiredPitchPct.toFixed(1)}% desvía la afinación en aprox. ${driftStr} semitonos`;
    
    // Slight penalty to harmonic confidence since real vinyl pitch won't be at concert pitch
    finalScore = Math.max(0, Math.round(baseScore * (1 - Math.min(0.35, absSemitones * 0.25))));
  }

  return {
    score: finalScore,
    relation,
    description,
    harmonicWarning,
  };
}
