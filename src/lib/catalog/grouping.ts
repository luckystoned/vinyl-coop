// src/lib/catalog/grouping.ts
import { Track } from '../../types/track';
import { AlbumRelease, TrackPracticeHistory } from '../../types/catalog';
import { PracticeSession } from '../../types/practice';
import { slugify } from '../normalization/inventory';

/**
 * Groups a flat list of tracks into Album Releases.
 * Within each album, tracks are grouped and sorted by Vinyl Side.
 */
export function groupTracksByAlbum(tracks: Track[]): AlbumRelease[] {
  const map = new Map<string, {
    album: string;
    artist: string;
    coverUrl: string | null;
    genres: Set<string>;
    sidesMap: Map<string, Track[]>;
    totalTracks: number;
  }>();

  for (const track of tracks) {
    const artist = track.artist || 'Desconocido';
    const album = track.album || 'Sin álbum';
    const key = `${slugify(artist)}___${slugify(album)}`;

    let entry = map.get(key);
    if (!entry) {
      entry = {
        album,
        artist,
        coverUrl: track.coverUrl || null,
        genres: new Set<string>(),
        sidesMap: new Map<string, Track[]>(),
        totalTracks: 0,
      };
      map.set(key, entry);
    }

    if (!entry.coverUrl && track.coverUrl) {
      entry.coverUrl = track.coverUrl;
    }

    if (track.genre) {
      entry.genres.add(track.genre);
    }

    const side = (track.vinylSide || 'A').toUpperCase().trim();
    const sideTracks = entry.sidesMap.get(side) || [];
    sideTracks.push(track);
    entry.sidesMap.set(side, sideTracks);
    entry.totalTracks += 1;
  }

  const releases: AlbumRelease[] = [];

  for (const [key, data] of map.entries()) {
    // Sort sides alphabetically (e.g. A, B, C, D)
    const sortedSides = Array.from(data.sidesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map(([side, sideTracks]) => ({
        side,
        tracks: sideTracks,
      }));

    releases.push({
      id: key,
      album: data.album,
      artist: data.artist,
      coverUrl: data.coverUrl,
      genres: Array.from(data.genres),
      sides: sortedSides,
      totalTracks: data.totalTracks,
    });
  }

  // Sort releases by Artist, then Album name
  releases.sort((a, b) => {
    const artistDiff = a.artist.localeCompare(b.artist);
    if (artistDiff !== 0) return artistDiff;
    return a.album.localeCompare(b.album);
  });

  return releases;
}

/**
 * Builds a fast lookup map of trackId -> { asSource: TransitionLog[], asTarget: TransitionLog[], totalCount: number }
 */
export function buildTrackHistoryMap(sessions: PracticeSession[]): Map<string, TrackPracticeHistory> {
  const map = new Map<string, TrackPracticeHistory>();

  for (const session of sessions) {
    for (const transition of session.transitions) {
      // Record source
      if (transition.source_track_id) {
        let entry = map.get(transition.source_track_id);
        if (!entry) {
          entry = { asSource: [], asTarget: [], totalCount: 0 };
          map.set(transition.source_track_id, entry);
        }
        entry.asSource.push(transition);
        entry.totalCount += 1;
      }

      // Record target
      if (transition.target_track_id) {
        let entry = map.get(transition.target_track_id);
        if (!entry) {
          entry = { asSource: [], asTarget: [], totalCount: 0 };
          map.set(transition.target_track_id, entry);
        }
        entry.asTarget.push(transition);
        entry.totalCount += 1;
      }
    }
  }

  return map;
}
