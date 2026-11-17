// src/pages/MixLabPage.tsx
import React, { useState, useMemo } from 'react';
import { PlusCircle } from 'lucide-react';
import { Track } from '../types/track';
import { RecommendationMode, GenreFilter, RecommendationResult } from '../types/recommendation';
import { CreateTransitionPayload } from '../types/practice';
import { getRecommendations } from '../lib/recommendations/engine';
import { api } from '../services/api';
import { TrackSelector } from '../components/mixlab/TrackSelector';
import { CurrentDeck } from '../components/mixlab/CurrentDeck';
import { Controls } from '../components/mixlab/Controls';
import { SuggestionList } from '../components/mixlab/SuggestionList';
import { IncompleteList } from '../components/mixlab/IncompleteList';
import { PracticeModal } from '../components/mixlab/PracticeModal';

interface MixLabPageProps {
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

export const MixLabPage: React.FC<MixLabPageProps> = ({
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

  const [activePracticeSuggestion, setActivePracticeSuggestion] = useState<RecommendationResult | null>(null);

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
    <main className="lab-content">
      {/* Active Session Info Bar */}
      <div className="session-bar" style={{ borderRadius: 'var(--radius-md)' }}>
        <div className="session-info">
          <span>Sesión activa:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {sessionId.substring(0, 16)}...
          </span>
          <span className="session-counter" title="Transiciones registradas en esta sesión">
            {transitionsInSession}
          </span>
        </div>

        <button
          type="button"
          onClick={onNewSession}
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
