// tests/normalization.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeInventoryRows } from '../src/lib/normalization/inventory';

describe('Inventory Normalization & Deterministic IDs', () => {
  // Mandatory Test 11: Identical titles disambiguation
  it('disambiguates identical track titles on same artist/album with occurrence counters', () => {
    const rawRows = [
      ['Artist', 'Album', 'Track', 'BPM', 'Key', 'Energy(1-5)', 'DJ_Use', 'Vinyl_Side', 'Camelot_Key', 'Tags', 'disco img', 'Genre'],
      ['Aphex Twin', 'Selected Ambient Works', 'Untitled', '120', 'Am', '3', 'Intro', 'A1', '8A', 'ambient', '', 'IDM / Experimental'],
      ['Aphex Twin', 'Selected Ambient Works', 'Untitled', '122', 'Em', '4', 'Peak', 'A2', '9A', 'ambient', '', 'IDM / Experimental'],
      // Even exact same side and title repeated
      ['Aphex Twin', 'Selected Ambient Works', 'Untitled', '122', 'Em', '4', 'Peak', 'A2', '9A', 'ambient', '', 'IDM / Experimental'],
    ];

    const tracks = normalizeInventoryRows(rawRows);
    expect(tracks.length).toBe(3);

    expect(tracks[0].id).toBe('aphex-twin__selected-ambient-works__untitled__a1');
    expect(tracks[1].id).toBe('aphex-twin__selected-ambient-works__untitled__a2');
    expect(tracks[2].id).toBe('aphex-twin__selected-ambient-works__untitled__a2__2');

    // All IDs must be strictly unique
    const uniqueIds = new Set(tracks.map(t => t.id));
    expect(uniqueIds.size).toBe(3);
  });

  it('detects headers by name regardless of column order or case', () => {
    // Reordered and altered casing
    const rawRows = [
      ['GENRE', 'TRACK', 'ARTIST', 'BPM', 'ALBUM', 'VINYL_SIDE', 'CAMELOT_KEY'],
      ['Techno', 'Spastik', 'Plastikman', '132', 'Sheet One', 'A', '8A'],
    ];

    const tracks = normalizeInventoryRows(rawRows);
    expect(tracks.length).toBe(1);
    const t = tracks[0];
    expect(t.artist).toBe('Plastikman');
    expect(t.album).toBe('Sheet One');
    expect(t.track).toBe('Spastik');
    expect(t.bpm).toBe(132);
    expect(t.camelotKey).toBe('8A');
    expect(t.genre).toBe('Techno');
    expect(t.vinylSide).toBe('A');
  });

  it('skips completely empty or blank rows', () => {
    const rawRows = [
      ['Artist', 'Album', 'Track', 'BPM', 'Key', 'Energy(1-5)', 'DJ_Use', 'Vinyl_Side', 'Camelot_Key', 'Tags', 'disco img', 'Genre'],
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      ['Jeff Mills', 'Waveform', 'The Bells', '135', 'Am', '5', 'Peak', 'A', '8A', 'loop', '', 'Techno'],
      ['   ', '   ', '   ', '', '', '', '', '', '', '', '', ''],
    ];

    const tracks = normalizeInventoryRows(rawRows);
    expect(tracks.length).toBe(1);
    expect(tracks[0].track).toBe('The Bells');
  });
});
