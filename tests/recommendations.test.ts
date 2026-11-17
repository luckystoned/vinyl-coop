// tests/recommendations.test.ts
import { describe, it, expect } from 'vitest';
import { Track } from '../src/types/track';
import { getRecommendations, isSameVinylOrTrack } from '../src/lib/recommendations/engine';

const baseTrack: Track = {
  id: 'current-artist__album-1__track-a__a',
  artist: 'Current Artist',
  album: 'Album 1',
  track: 'Track A',
  bpm: 130,
  key: 'Am',
  camelotKey: '8A',
  energy: 4,
  djUse: 'Peak',
  vinylSide: 'A',
  tags: ['acid', 'modular'],
  coverUrl: null,
  genre: 'Techno',
};

const candidatePerfect: Track = {
  id: 'other-artist__album-2__track-b__b',
  artist: 'Other Artist',
  album: 'Album 2',
  track: 'Track B',
  bpm: 130, // exact BPM
  key: 'Am',
  camelotKey: '8A', // exact Camelot
  energy: 4, // exact energy
  djUse: 'Peak',
  vinylSide: 'B',
  tags: ['acid', 'modular'],
  coverUrl: null,
  genre: 'Techno', // exact genre
};

const candidateNeighbor: Track = {
  id: 'other-artist-2__album-3__track-c__a',
  artist: 'Other Artist 2',
  album: 'Album 3',
  track: 'Track C',
  bpm: 131, // +0.77% pitch
  key: 'Em',
  camelotKey: '9A', // adjacent
  energy: 3, // diff 1
  djUse: 'Mid',
  vinylSide: 'A',
  tags: ['modular'],
  coverUrl: null,
  genre: 'Techno',
};

const candidateSameAlbum: Track = {
  id: 'current-artist__album-1__track-d__b',
  artist: 'Current Artist',
  album: 'Album 1', // SAME ALBUM!
  track: 'Track D',
  bpm: 130,
  key: 'Am',
  camelotKey: '8A',
  energy: 4,
  djUse: 'Peak',
  vinylSide: 'B',
  tags: [],
  coverUrl: null,
  genre: 'Techno',
};

const candidateNoBpm: Track = {
  id: 'ambient-artist__ambient-album__track-e__a',
  artist: 'Ambient Artist',
  album: 'Ambient Album',
  track: 'Track E',
  bpm: null, // MISSING BPM
  key: 'C',
  camelotKey: '8B',
  energy: 2,
  djUse: '',
  vinylSide: 'A',
  tags: ['drone'],
  coverUrl: null,
  genre: 'Ambient / Downtempo',
};

const candidateNoKey: Track = {
  id: 'electro-artist__album-4__track-f__a',
  artist: 'Electro Artist',
  album: 'Album 4',
  track: 'Track F',
  bpm: 130,
  key: '',
  camelotKey: null, // MISSING KEY
  energy: 4,
  djUse: '',
  vinylSide: 'A',
  tags: [],
  coverUrl: null,
  genre: 'Electro',
};

describe('Recommendation Engine', () => {
  // Mandatory Test 10: Same vinyl / album exclusion
  it('excludes candidates from the same vinyl album or same track', () => {
    expect(isSameVinylOrTrack(baseTrack, baseTrack)).toBe(true);
    expect(isSameVinylOrTrack(baseTrack, candidateSameAlbum)).toBe(true);
    expect(isSameVinylOrTrack(baseTrack, candidatePerfect)).toBe(false);

    const inventory = [candidateSameAlbum, candidatePerfect];
    const res = getRecommendations(baseTrack, inventory, {
      mode: 'precise',
      genreFilter: 'all',
      pitchTolerancePct: 3.0,
      currentPitchPct: 0.0,
    });

    // candidateSameAlbum must NOT be present in recommendations
    const foundSameAlbum = res.rankedRecommendations.some(r => r.track.album === baseTrack.album);
    expect(foundSameAlbum).toBe(false);
    expect(res.rankedRecommendations.length).toBe(1);
    expect(res.rankedRecommendations[0].track.id).toBe(candidatePerfect.id);
  });

  // Mandatory Test 7: Ranking with BPM, Key, Genre, and Energy
  it('ranks candidates using configured weights (Precise mode: 40/25/25/10)', () => {
    const inventory = [candidateNeighbor, candidatePerfect];
    const res = getRecommendations(baseTrack, inventory, {
      mode: 'precise',
      genreFilter: 'all',
      pitchTolerancePct: 3.0,
      currentPitchPct: 0.0,
    });

    expect(res.rankedRecommendations.length).toBe(2);
    // candidatePerfect should be #1 with 100 or near 100 score
    expect(res.rankedRecommendations[0].track.id).toBe(candidatePerfect.id);
    expect(res.rankedRecommendations[0].overallScore).toBe(100);

    // candidateNeighbor should be #2 with slightly lower score
    expect(res.rankedRecommendations[1].track.id).toBe(candidateNeighbor.id);
    expect(res.rankedRecommendations[1].overallScore).toBeLessThan(100);
    expect(res.rankedRecommendations[1].overallScore).toBeGreaterThan(70);
  });

  // Mandatory Test 8: Reweighting when Key is missing
  it('reweights remaining criteria proportionally when Key is missing', () => {
    const inventory = [candidateNoKey];
    const res = getRecommendations(baseTrack, inventory, {
      mode: 'precise',
      genreFilter: 'all',
      pitchTolerancePct: 3.0,
      currentPitchPct: 0.0,
    });

    expect(res.rankedRecommendations.length).toBe(1);
    const rec = res.rankedRecommendations[0];
    expect(rec.isPartial).toBe(true);
    expect(rec.warnings.some(w => w.includes('información parcial'))).toBe(true);
    // Candidate has 100% on BPM (40 weight), 100% on Energy (10 weight), ~80% on Genre (25 weight).
    // Total weight available: 40 + 10 + 25 = 75.
    // Weighted sum = 100*40 + 100*10 + 80*25 = 7000.
    // Normalized score = 7000 / 75 = 93.3% -> 93.
    expect(rec.overallScore).toBeGreaterThanOrEqual(85);
    expect(rec.breakdown.camelotScore).toBe(0);
  });

  // Mandatory Test 9: Handling tracks without BPM
  it('places tracks without BPM in incompleteDataAlternatives, excluded from precise ranking', () => {
    const inventory = [candidatePerfect, candidateNoBpm];
    const res = getRecommendations(baseTrack, inventory, {
      mode: 'precise',
      genreFilter: 'all',
      pitchTolerancePct: 3.0,
      currentPitchPct: 0.0,
    });

    // candidateNoBpm must NOT be in rankedRecommendations
    const rankedHasNoBpm = res.rankedRecommendations.some(r => r.track.id === candidateNoBpm.id);
    expect(rankedHasNoBpm).toBe(false);

    // candidateNoBpm must be in incompleteDataAlternatives
    const altHasNoBpm = res.incompleteDataAlternatives.some(t => t.id === candidateNoBpm.id);
    expect(altHasNoBpm).toBe(true);
  });
});
