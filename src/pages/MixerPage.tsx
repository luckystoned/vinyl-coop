// src/pages/MixerPage.tsx
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { PlusCircle, CheckCircle2 } from 'lucide-react';
import { Track } from '../types/track';
import { RecommendationMode, GenreFilter, RecommendationResult } from '../types/recommendation';
import { CreateTransitionPayload } from '../types/practice';
import { getRecommendations } from '../lib/recommendations/engine';
import { api } from '../services/api';
import { TrackSelector } from '../components/mixer/TrackSelector';
import { CurrentDeck } from '../components/mixer/CurrentDeck';
import { Controls } from '../components/mixer/Controls';
import { SuggestionList } from '../components/mixer/SuggestionList';
import { IncompleteList } from '../components/mixer/IncompleteList';
import { PracticeModal } from '../components/mixer/PracticeModal';

interface MixerPageProps {
  tracks: Track[];
  currentTrack: Track | null;
  onSelectTrack: (track: Track) => void;
  sessionId: string;
  onNewSession: () => void;
  transitionsInSession: number;
  onTransitionLogged: () => void;
  onRefreshCollection: () => void;
  isRefreshing: boolean;
}

export const MixerPage: React.FC<MixerPageProps> = ({
  tracks,
  currentTrack,
  onSelectTrack,
  sessionId,
  onNewSession,
  transitionsInSession,
  onTransitionLogged,
  onRefreshCollection,
  isRefreshing,
}) => {
  const [deckAPitchPct, setDeckAPitchPct] = useState<number>(0.0);
  const [mode, setMode] = useState<RecommendationMode>('precise');
  const [genreFilter, setGenreFilter] = useState<GenreFilter>('same_genre');
  const [pitchTolerancePct, setPitchTolerancePct] = useState<number>(3.0);
  const [sessionFlash, setSessionFlash] = useState<boolean>(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activePracticeSuggestion, setActivePracticeSuggestion] = useState<RecommendationResult | null>(null);

  const handleNewSession = useCallback(() => {
    const proceed = transitionsInSession === 0 || window.confirm(
      `¿Iniciás una nueva sesión?\nSe resetea el deck A y el contador (${transitionsInSession} transición${transitionsInSession === 1 ? '' : 'es'} registrada${transitionsInSession === 1 ? '' : 's'}).`
    );
    if (!proceed) return;

    setDeckAPitchPct(0.0); // Reset pitch fader
    onNewSession();

    // Show flash confirmation
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setSessionFlash(true);
    flashTimerRef.current = setTimeout(() => setSessionFlash(false), 2500);
  }, [transitionsInSession, onNewSession]);

  // Format session ID as human-readable label: "sess_17..." → "17 nov 18:03"
  const sessionLabel = useMemo(() => {
    const tsMatch = sessionId.match(/sess_(\d+)/);
    if (!tsMatch) return sessionId.substring(0, 12);
    const ts = parseInt(tsMatch[1], 10);
    const d = new Date(ts);
    const day = d.getDate();
    const month = d.toLocaleString('es-AR', { month: 'short' });
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${h}:${m}`;
  }, [sessionId]);

  // Recommendations calculated instantly on client side once inventory is loaded
  const { rankedRecommendations, incompleteDataAlternatives } = useMemo(() => {
    if (!currentTrack) {
      return { rankedRecommendations: [], incompleteDataAlternatives: [] };
    }

    return getRecommendations(currentTrack, tracks, {
      mode,
      genreFilter,
      pitchTolerancePct,
      currentPitchPct: deckAPitchPct,
    });
  }, [currentTrack, tracks, mode, genreFilter, pitchTolerancePct, deckAPitchPct]);

  const handleUseAsNextTrack = (track: Track) => {
    onSelectTrack(track);
    setDeckAPitchPct(0.0); // Reset fader for new track on Deck A
  };

  const handleSaveTransition = async (payload: CreateTransitionPayload): Promise<boolean> => {
    const res = await api.saveTransition(payload);
    if (res.success) {
      onTransitionLogged();
      return true;
    }
    return false;
  };

  return (
    <main className="main-content">
      {/* Session reset flash confirmation */}
      {sessionFlash && (
        <div
          style={{
            padding: '8px 14px',
            backgroundColor: 'rgba(0,229,255,0.12)',
            border: '1px solid var(--color-cyan)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-cyan)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle2 size={15} />
          ¡Nueva sesión iniciada! El deck A fue reseteado.
        </div>
      )}

      {/* Active Session Info Bar */}
      <div className="session-bar" style={{ borderRadius: 'var(--radius-md)' }}>
        <div className="session-info">
          <span>Sesión:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {sessionLabel}
          </span>
          <span className="session-counter" title="Transiciones registradas en esta sesión">
            {transitionsInSession}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNewSession}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-cyan)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 600,
          }}
        >
          <PlusCircle size={14} />
          Nueva sesión
        </button>
      </div>

      {/* Track Search Autocomplete */}
      <TrackSelector
        tracks={tracks}
        onSelectTrack={handleUseAsNextTrack}
        currentTrackId={currentTrack?.id}
      />

      {/* Deck A (Currently Playing Record) */}
      <CurrentDeck
        track={currentTrack}
        currentPitchPct={deckAPitchPct}
        onPitchChange={setDeckAPitchPct}
      />

      {/* Recommendation Controls */}
      {currentTrack && (
        <>
          <Controls
            mode={mode}
            onModeChange={setMode}
            genreFilter={genreFilter}
            onGenreFilterChange={setGenreFilter}
            pitchTolerancePct={pitchTolerancePct}
            onPitchToleranceChange={setPitchTolerancePct}
            onRefreshCollection={onRefreshCollection}
            isRefreshing={isRefreshing}
          />

          {/* Recommendations List */}
          <SuggestionList
            suggestions={rankedRecommendations}
            onUseAsNextTrack={handleUseAsNextTrack}
            onPracticeTransition={setActivePracticeSuggestion}
          />

          {/* Incomplete Data Alternatives */}
          <IncompleteList
            tracks={incompleteDataAlternatives}
            onSelectTrack={handleUseAsNextTrack}
          />
        </>
      )}

      {/* Practice Log Modal ("Probé esta mezcla") */}
      {activePracticeSuggestion && currentTrack && (
        <PracticeModal
          sourceTrack={currentTrack}
          suggestion={activePracticeSuggestion}
          sessionId={sessionId}
          mode={mode}
          genreFilter={genreFilter}
          onClose={() => setActivePracticeSuggestion(null)}
          onSubmit={handleSaveTransition}
          onSuccessNextTrack={handleUseAsNextTrack}
        />
      )}
    </main>
  );
};
