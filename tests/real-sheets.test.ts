// tests/real-sheets.test.ts
import { describe, it, expect } from 'vitest';
import { isGoogleSheetsConfigured, getInventory, getPracticeSessions } from '../api/_lib/sheets';
import { getRecommendations } from '../src/lib/recommendations/engine';
import loginHandler from '../api/login';
import { ensureEnvLoaded } from '../api/_lib/env';

ensureEnvLoaded();

describe.skipIf(!isGoogleSheetsConfigured())('Real Google Sheets Integration Verification', () => {
  it('verifies credentials and connection to Google Sheets', async () => {
    const isConfigured = isGoogleSheetsConfigured();
    console.log('Is Google Sheets configured:', isConfigured);
    expect(isConfigured).toBe(true);

    // 1. Fetch real inventory
    console.log('Fetching Vinyl Inventory from Google Sheets...');
    const { tracks, demoMode } = await getInventory(true);

    console.log(`Fetch completed. demoMode=${demoMode}, tracksCount=${tracks.length}`);
    expect(demoMode).toBe(false);
    expect(tracks.length).toBe(497);

    // 2. Check Genre field on the 497 tracks
    const genresFound = new Set<string>();
    let missingGenreCount = 0;

    for (const t of tracks) {
      if (t.genre && t.genre.trim()) {
        genresFound.add(t.genre);
      } else {
        missingGenreCount++;
      }
    }

    console.log('Genres found in 497 tracks:', Array.from(genresFound));
    console.log('Missing genre count:', missingGenreCount);
    expect(missingGenreCount).toBe(0);
    expect(genresFound.size).toBeGreaterThan(1);

    // 3. Select a real track and calculate recommendations
    const sampleTrack = tracks.find(t => t.bpm && t.bpm >= 125 && t.bpm <= 135) || tracks[0];
    console.log('Selected real track:', {
      artist: sampleTrack.artist,
      track: sampleTrack.track,
      bpm: sampleTrack.bpm,
      camelot: sampleTrack.camelotKey,
      genre: sampleTrack.genre,
    });

    const recommendations = getRecommendations(sampleTrack, tracks, {
      mode: 'precise',
      genreFilter: 'same_genre',
      pitchTolerancePct: 3.0,
      currentPitchPct: 0.0,
    });

    console.log(`Generated ${recommendations.rankedRecommendations.length} precise recommendations`);
    expect(recommendations.rankedRecommendations.length).toBeGreaterThan(0);

    const topMatch = recommendations.rankedRecommendations[0];
    console.log('Top recommendation match:', {
      artist: topMatch.track.artist,
      track: topMatch.track.track,
      score: topMatch.overallScore,
      requiredPitch: topMatch.requiredPitchPct,
      reasons: topMatch.reasons,
    });
    expect(topMatch.overallScore).toBeGreaterThanOrEqual(60);

    // 4. Verify login endpoint with APP_PASSWORD
    const password = process.env.APP_PASSWORD;
    expect(password).toBeDefined();

    let resBody: any = null;
    const req = {
      method: 'POST',
      headers: { host: 'localhost' },
      body: { password },
    };
    const res = {
      statusCode: 200,
      setHeader: () => {},
      end: (data: string) => {
        resBody = JSON.parse(data);
      },
    };

    await loginHandler(req, res);
    expect(resBody.success).toBe(true);
    expect(resBody.sheetConfigured).toBe(true);
    expect(resBody.demoMode).toBe(false);

    // 5. Read current practice sessions from Practice_Log
    const { sessions, demoMode: sessionsDemoMode } = await getPracticeSessions();
    console.log(`Current Practice_Log sessions count: ${sessions.length}, demoMode=${sessionsDemoMode}`);
    expect(sessionsDemoMode).toBe(false);
  }, 25000);
});
