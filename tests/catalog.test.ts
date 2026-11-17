// tests/catalog.test.ts
import { describe, it, expect } from 'vitest';
import { groupTracksByAlbum, buildTrackHistoryMap } from '../src/lib/catalog/grouping';
import { Track } from '../src/types/track';
import { PracticeSession } from '../src/types/practice';

describe('Catalog grouping and history tests', () => {
  const mockTracks: Track[] = [
    {
      id: 'aphex_saw_ptolemy_c',
      artist: 'Aphex Twin',
      album: 'Selected Ambient Works 85-92',
      track: 'Ptolemy',
      bpm: 126,
      key: 'Dbm',
      camelotKey: '7A',
      energy: 4,
      djUse: 'Closer',
      vinylSide: 'C',
      tags: ['classic', 'techno'],
      coverUrl: 'http://img.com/saw.jpg',
      genre: 'Techno',
    },
    {
      id: 'aphex_saw_heliosphan_b',
      artist: 'Aphex Twin',
      album: 'Selected Ambient Works 85-92',
      track: 'Heliosphan',
      bpm: 130,
      key: 'Gm',
      camelotKey: '6A',
      energy: 5,
      djUse: 'Peak',
      vinylSide: 'B',
      tags: ['classic'],
      coverUrl: null,
      genre: 'Techno',
    },
    {
      id: 'flylo_cosmogramma_compface_a',
      artist: 'Flying Lotus',
      album: 'Cosmogramma',
      track: 'Computer Face//Pure Being',
      bpm: 128,
      key: 'Dbm',
      camelotKey: '7A',
      energy: 4,
      djUse: 'Mid',
      vinylSide: 'A',
      tags: ['idm', 'beat'],
      coverUrl: null,
      genre: 'IDM / Experimental',
    },
  ];

  it('groups tracks into album releases with sides sorted alphabetically', () => {
    const releases = groupTracksByAlbum(mockTracks);

    expect(releases).toHaveLength(2);

    const saw = releases.find(r => r.album === 'Selected Ambient Works 85-92');
    expect(saw).toBeDefined();
    expect(saw?.artist).toBe('Aphex Twin');
    expect(saw?.totalTracks).toBe(2);
    expect(saw?.coverUrl).toBe('http://img.com/saw.jpg');
    expect(saw?.sides).toHaveLength(2);
    // B should come before C
    expect(saw?.sides[0].side).toBe('B');
    expect(saw?.sides[0].tracks[0].track).toBe('Heliosphan');
    expect(saw?.sides[1].side).toBe('C');
    expect(saw?.sides[1].tracks[0].track).toBe('Ptolemy');

    const cosmo = releases.find(r => r.album === 'Cosmogramma');
    expect(cosmo).toBeDefined();
    expect(cosmo?.totalTracks).toBe(1);
    expect(cosmo?.sides[0].side).toBe('A');
  });

  it('builds track history map correctly from sessions', () => {
    const mockSessions: PracticeSession[] = [
      {
        sessionId: 'sess_1',
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:30:00Z',
        transitionsCount: 1,
        firstTrackName: 'Ptolemy',
        lastTrackName: 'Computer Face//Pure Being',
        transitions: [
          {
            transition_id: 'tr_1',
            session_id: 'sess_1',
            created_at: '2026-03-01T10:15:00Z',
            source_track_id: 'aphex_saw_ptolemy_c',
            source_artist: 'Aphex Twin',
            source_album: 'Selected Ambient Works 85-92',
            source_track: 'Ptolemy',
            target_track_id: 'flylo_cosmogramma_compface_a',
            target_artist: 'Flying Lotus',
            target_album: 'Cosmogramma',
            target_track: 'Computer Face//Pure Being',
            mode: 'precise',
            genre_filter: 'same_genre',
            transition_type: 'beatmatch',
            suggested_pitch_pct: -1.56,
            used_pitch_pct: -1.56,
            pitch_bend_pct: null,
            rating: 5,
            notes: 'Test transition',
            recommendation_reasons: 'Same key',
          },
        ],
      },
    ];

    const historyMap = buildTrackHistoryMap(mockSessions);

    const ptolemyHist = historyMap.get('aphex_saw_ptolemy_c');
    expect(ptolemyHist).toBeDefined();
    expect(ptolemyHist?.totalCount).toBe(1);
    expect(ptolemyHist?.asSource).toHaveLength(1);
    expect(ptolemyHist?.asTarget).toHaveLength(0);

    const compFaceHist = historyMap.get('flylo_cosmogramma_compface_a');
    expect(compFaceHist).toBeDefined();
    expect(compFaceHist?.totalCount).toBe(1);
    expect(compFaceHist?.asSource).toHaveLength(0);
    expect(compFaceHist?.asTarget).toHaveLength(1);

    const unplayedHist = historyMap.get('aphex_saw_heliosphan_b');
    expect(unplayedHist).toBeUndefined();
  });
});
