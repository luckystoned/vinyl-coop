// tests/genre.test.ts
import { describe, it, expect } from 'vitest';
import { Track } from '../src/types/track';
import { getRecommendations } from '../src/lib/recommendations/engine';
import { calculateGenreCompatibility } from '../src/lib/genre/affinity';

const baseTrack: Track = {
  id: 'dj__album__track1__a',
  artist: 'Techno Master',
  album: 'Dark Series',
  track: 'Axis 1',
  bpm: 132,
  key: 'Dm',
  camelotKey: '7A',
  energy: 4,
  djUse: 'Peak',
  vinylSide: 'A',
  tags: ['modular', 'dark'],
  coverUrl: null,
  genre: 'Techno',
};

const technoCandidate: Track = {
  id: 'dj2__album2__track2__a',
  artist: 'Detroit Hero',
  album: 'Motor City',
  track: 'Galaxy 2 Galaxy',
  bpm: 132,
  key: 'Dm',
  camelotKey: '7A',
  energy: 4,
  djUse: 'Peak',
  vinylSide: 'A',
  tags: ['deep'],
  coverUrl: null,
  genre: 'Techno',
};

const houseCandidate: Track = {
  id: 'dj3__album3__track3__a',
  artist: 'Chicago DJ',
  album: 'Jack Track',
  track: 'Can You Feel It',
  bpm: 130,
  key: 'Dm',
  camelotKey: '7A',
  energy: 3,
  djUse: 'Mid',
  vinylSide: 'A',
  tags: ['classic'],
  coverUrl: null,
  genre: 'House',
};

const rockCandidate: Track = {
  id: 'band__album4__track4__a',
  artist: 'Rock Band',
  album: 'Guitars',
  track: 'Solo Track',
  bpm: 131,
  key: 'Dm',
  camelotKey: '7A',
  energy: 4,
  djUse: '',
  vinylSide: 'A',
  tags: ['guitar'],
  coverUrl: null,
  genre: 'Rock',
};

describe('Genre Compatibility & Filters', () => {
  // Mandatory Test 12: Strict Techno filter
  it('strictly filters only Techno tracks when techno_only is enabled', () => {
    const inventory = [technoCandidate, houseCandidate, rockCandidate];
    const res = getRecommendations(baseTrack, inventory, {
      mode: 'precise',
      genreFilter: 'techno_only',
      pitchTolerancePct: 3.0,
      currentPitchPct: 0.0,
    });

    // Only technoCandidate should pass through
    expect(res.rankedRecommendations.length).toBe(1);
    expect(res.rankedRecommendations[0].track.genre).toBe('Techno');
    expect(res.rankedRecommendations[0].track.id).toBe(technoCandidate.id);
  });

  it('boosts affinity when secondary tags match', () => {
    // Techno with Electro without shared tags
    const withoutShared = calculateGenreCompatibility('Techno', 'Electro', ['raw'], ['clean']);
    // Techno with Electro with shared 'acid' tag
    const withShared = calculateGenreCompatibility('Techno', 'Electro', ['acid', 'analog'], ['acid']);

    expect(withShared.score).toBeGreaterThan(withoutShared.score);
    expect(withShared.matchedTags).toContain('acid');
  });

  it('scores affinity appropriately across known genre pairings', () => {
    const technoTechno = calculateGenreCompatibility('Techno', 'Techno');
    const technoElectro = calculateGenreCompatibility('Techno', 'Electro');
    const technoRock = calculateGenreCompatibility('Techno', 'Rock');

    expect(technoTechno.score).toBe(100);
    expect(technoElectro.score).toBe(80);
    expect(technoRock.score).toBeLessThanOrEqual(25);
  });
});
