// src/components/mixlab/Controls.tsx
import React from 'react';
import { RefreshCw, Compass, Target } from 'lucide-react';
import { RecommendationMode, GenreFilter } from '../../types/recommendation';

interface ControlsProps {
  mode: RecommendationMode;
  onModeChange: (mode: RecommendationMode) => void;
  genreFilter: GenreFilter;
  onGenreFilterChange: (filter: GenreFilter) => void;
  pitchTolerancePct: number;
  onPitchToleranceChange: (val: number) => void;
  onRefreshCollection: () => void;
  isRefreshing: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  mode,
  onModeChange,
  genreFilter,
  onGenreFilterChange,
  pitchTolerancePct,
  onPitchToleranceChange,
  onRefreshCollection,
  isRefreshing,
}) => {
  return (
    <div className="controls-panel">
      {/* Mode Switcher */}
      <div className="control-row">
        <div className="control-label">
          <span>Modo de recomendación</span>
          <button
            type="button"
            onClick={onRefreshCollection}
            disabled={isRefreshing}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-cyan)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RefreshCw size={12} className={isRefreshing ? 'spin' : ''} />
            {isRefreshing ? 'Actualizando...' : 'Refrescar colección'}
          </button>
        </div>

        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-btn ${mode === 'precise' ? 'active' : ''}`}
            onClick={() => {
              onModeChange('precise');
              // Automatically adjust default tolerance when switching mode if at standard default
              if (pitchTolerancePct === 6) onPitchToleranceChange(3);
            }}
          >
            <Target size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Mezcla precisa (±3%)
          </button>
          <button
            type="button"
            className={`segmented-btn ${mode === 'explore' ? 'active' : ''}`}
            onClick={() => {
              onModeChange('explore');
              if (pitchTolerancePct === 3) onPitchToleranceChange(6);
            }}
          >
            <Compass size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Explorar (±6%)
          </button>
        </div>
      </div>

      {/* Genre Filter */}
      <div className="control-row">
        <div className="control-label">
          <span>Filtro de género</span>
        </div>

        <div className="filter-pills-row">
          <button
            type="button"
            className={`filter-pill-btn ${genreFilter === 'same_genre' ? 'active' : ''}`}
            onClick={() => onGenreFilterChange('same_genre')}
          >
            Mismo género
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${genreFilter === 'techno_only' ? 'active' : ''}`}
            onClick={() => onGenreFilterChange('techno_only')}
          >
            Solo Techno
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${genreFilter === 'all' ? 'active' : ''}`}
            onClick={() => onGenreFilterChange('all')}
          >
            Todos los géneros
          </button>
        </div>
      </div>

      {/* Pitch Tolerance Slider */}
      <div className="control-row">
        <div className="control-label">
          <span>Tolerancia máxima de pitch:</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', fontWeight: 700 }}>
            ±{pitchTolerancePct.toFixed(1)}%
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ±1%
          </span>
          <input
            type="range"
            min="1"
            max="8"
            step="0.5"
            value={pitchTolerancePct}
            onChange={e => onPitchToleranceChange(parseFloat(e.target.value))}
            className="pitch-slider"
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ±8%
          </span>
        </div>
      </div>
    </div>
  );
};
