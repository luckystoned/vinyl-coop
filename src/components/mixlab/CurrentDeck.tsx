// src/components/mixlab/CurrentDeck.tsx
import React from 'react';
import { Disc, Sliders, RotateCcw, Zap } from 'lucide-react';
import { Track } from '../../types/track';
import { calculateEffectiveBpm, formatPitchPct } from '../../lib/bpm/pitch';

interface CurrentDeckProps {
  track: Track | null;
  currentPitchPct: number;
  onPitchChange: (pitch: number) => void;
}

export const CurrentDeck: React.FC<CurrentDeckProps> = ({
  track,
  currentPitchPct,
  onPitchChange,
}) => {
  if (!track) {
    return (
      <div className="deck-card" style={{ textAlign: 'center', padding: '32px 16px' }}>
        <Disc size={36} color="#64748b" style={{ margin: '0 auto 8px' }} />
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Seleccioná un vinilo para comenzar a mezclar
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
          Buscá arriba por artista, álbum o título de track
        </div>
      </div>
    );
  }

  const effectiveBpm = calculateEffectiveBpm(track.bpm ?? 0, currentPitchPct);

  return (
    <div className="deck-card">
      <div className="deck-header">
        <div className="deck-label">
          <Disc size={14} />
          Bandeja A • Vinilo en Giro
        </div>
        {track.vinylSide && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              background: 'rgba(249, 115, 22, 0.15)',
              color: 'var(--color-orange)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
            }}
          >
            LADO {track.vinylSide}
          </span>
        )}
      </div>

      <div className="deck-body">
        <div className="vinyl-artwork-box">
          {track.coverUrl ? (
            <img
              src={track.coverUrl}
              alt={track.album}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => {
                // Fallback to placeholder if cover image fails to load
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="vinyl-disc-placeholder">
              <div className="vinyl-center-label">
                <div className="vinyl-spindle-hole" />
              </div>
            </div>
          )}
        </div>

        <div className="deck-info">
          <div className="track-title" title={track.track}>
            {track.track}
          </div>
          <div className="track-artist" title={track.artist}>
            {track.artist}
          </div>
          <div className="track-album" title={track.album}>
            {track.album}
          </div>

          <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 7px',
                borderRadius: '4px',
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              {track.genre}
            </span>

            {track.energy !== null && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: 'var(--color-amber)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Zap size={11} />
                {track.energy}/5
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="metrics-row">
        <div className="metric-pill cyan">
          <span>{track.bpm ? `${track.bpm} BPM` : 'BPM ?'}</span>
        </div>
        {track.camelotKey && (
          <div className="metric-pill green">
            <span>Camelot {track.camelotKey}</span>
            {track.key && <span style={{ opacity: 0.7 }}>({track.key})</span>}
          </div>
        )}
        {track.djUse && (
          <div className="metric-pill" style={{ color: 'var(--text-secondary)' }}>
            <span>{track.djUse}</span>
          </div>
        )}
      </div>

      {/* Deck A Pitch Fader */}
      <div className="fader-box">
        <div className="fader-header">
          <div className="fader-title">
            <Sliders size={13} />
            <span>Pitch Bandeja A:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', fontWeight: 700 }}>
              {formatPitchPct(currentPitchPct)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="effective-bpm-badge">
              {track.bpm ? `${effectiveBpm.toFixed(2)} BPM efectivo` : 'Sin tempo'}
            </span>
            {currentPitchPct !== 0 && (
              <button
                type="button"
                className="reset-fader-btn"
                onClick={() => onPitchChange(0)}
                title="Reset pitch a 0%"
              >
                <RotateCcw size={11} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                0%
              </button>
            )}
          </div>
        </div>

        <div className="fader-slider-row">
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            -8%
          </span>
          <input
            type="range"
            min="-8"
            max="8"
            step="0.1"
            value={currentPitchPct}
            onChange={e => onPitchChange(parseFloat(e.target.value))}
            className="pitch-slider"
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            +8%
          </span>
        </div>
      </div>
    </div>
  );
};
