// tests/camelot.test.ts
import { describe, it, expect } from 'vitest';
import {
  parseCamelotKey,
  getCamelotCircularDistance,
  calculateCamelotCompatibility,
} from '../src/lib/camelot/wheel';

describe('Camelot Wheel & Harmonic Compatibility', () => {
  it('parses Camelot notation correctly', () => {
    expect(parseCamelotKey('8A')).toEqual({ number: 8, mode: 'A', raw: '8A' });
    expect(parseCamelotKey(' 11b ')).toEqual({ number: 11, mode: 'B', raw: '11B' });
    expect(parseCamelotKey('12A')).toEqual({ number: 12, mode: 'A', raw: '12A' });
    expect(parseCamelotKey('1B')).toEqual({ number: 1, mode: 'B', raw: '1B' });
    expect(parseCamelotKey('13A')).toBeNull();
    expect(parseCamelotKey('0B')).toBeNull();
    expect(parseCamelotKey('invalid')).toBeNull();
    expect(parseCamelotKey(null)).toBeNull();
  });

  // Mandatory Test 4: Camelot compatibility
  it('calculates exact Camelot match score', () => {
    const res = calculateCamelotCompatibility('8A', '8A', 'precise');
    expect(res).not.toBeNull();
    expect(res?.score).toBe(100);
    expect(res?.relation).toBe('exact');
    expect(res?.description).toContain('Misma tonalidad');
  });

  // Mandatory Test 5: Camelot neighbors with 12 <-> 1 wrap
  it('correctly handles circular wrap between 12 and 1', () => {
    // Direct distance between 12 and 1 must be 1
    expect(getCamelotCircularDistance(12, 1)).toBe(1);
    expect(getCamelotCircularDistance(1, 12)).toBe(1);
    expect(getCamelotCircularDistance(11, 1)).toBe(2);

    // 12A to 1A is a neighbor (+1 step)
    const res12to1 = calculateCamelotCompatibility('12A', '1A', 'precise');
    expect(res12to1).not.toBeNull();
    expect(res12to1?.score).toBe(90);
    expect(res12to1?.relation).toBe('adjacent');

    // 1A to 12A is a neighbor (-1 step)
    const res1to12 = calculateCamelotCompatibility('1A', '12A', 'precise');
    expect(res1to12).not.toBeNull();
    expect(res1to12?.score).toBe(90);
    expect(res1to12?.relation).toBe('adjacent');

    // Regular neighbor 8A to 9A and 8A to 7A
    const res8to9 = calculateCamelotCompatibility('8A', '9A', 'precise');
    expect(res8to9?.score).toBe(90);
    expect(res8to9?.relation).toBe('adjacent');
  });

  // Mandatory Test 6: Relative major and minor (same number, A vs B)
  it('correctly scores relative major and relative minor', () => {
    // 8A (A minor) and 8B (C major)
    const resMinorToMajor = calculateCamelotCompatibility('8A', '8B', 'precise');
    expect(resMinorToMajor).not.toBeNull();
    expect(resMinorToMajor?.score).toBe(85);
    expect(resMinorToMajor?.relation).toBe('relative');
    expect(resMinorToMajor?.description).toContain('mayor relativa');

    // 8B to 8A
    const resMajorToMinor = calculateCamelotCompatibility('8B', '8A', 'precise');
    expect(resMajorToMinor?.score).toBe(85);
    expect(resMajorToMinor?.relation).toBe('relative');
    expect(resMajorToMinor?.description).toContain('menor relativa');
  });

  it('warns when high vinyl pitch adjustment alters key', () => {
    // Pitch shift of +5.5% (close to 1 semitone shift)
    const resWithPitch = calculateCamelotCompatibility('8A', '8A', 'precise', 5.5);
    expect(resWithPitch?.harmonicWarning).toBeDefined();
    expect(resWithPitch?.harmonicWarning).toContain('semitonos');
    // Score is penalized due to analog drift away from original key
    expect(resWithPitch!.score).toBeLessThan(100);
  });
});
