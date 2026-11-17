// src/components/mixlab/SuggestionList.tsx
import React from 'react';
import { Play, CheckCircle2, AlertTriangle, Disc } from 'lucide-react';
import { RecommendationResult } from '../../types/recommendation';
import { formatPitchPct } from '../../lib/bpm/pitch';

interface SuggestionListProps {
  suggestions: RecommendationResult[];
  onUseAsNextTrack: (track: RecommendationResult['track']) => void;
  onPracticeTransition: (suggestion: RecommendationResult) => void;
}

export const SuggestionList: React.FC<SuggestionListProps> = ({
  suggestions,
  onUseAsNextTrack,
  onPracticeTransition,
}) => {
  if (suggestions.length === 0) {
    return (
      <div
        className="deck-card"
        style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)' }}
      >
        <Disc size={32} color="#64748b" style={{ margin: '0 auto 10px' }} />
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
          No se encontraron vinilos compatibles con los filtros actuales
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Probá ampliando la tolerancia de pitch o seleccionando "Explorar" o "Todos los géneros".
        </div>
      </div>
    );
  }

  return (
    <div className="suggestions-section">
      <div className="section-header">
        <span className="section-title">
          Vinilos sugeridos ({suggestions.length})
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Ordenados por compatibilidad
        </span>
      </div>

      {suggestions.map(item => {
        const { track, overallScore, requiredPitchPct, reasons, warnings } = item;

        const scoreClass = overallScore >= 80 ? 'high' : overallScore >= 60 ? 'mid' : 'low';

        return (
          <div key={track.id} className="suggestion-card">
            <div className="card-top">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 }}>
                {/* Artwork or Disc placeholder */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#151822',
                    border: '1px solid var(--border-subtle)',
                    flexShrink: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {track.coverUrl ? (
                    <img
                      src={track.coverUrl}
                      alt={track.album}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Disc size={22} color="#64748b" />
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {track.track}
                  </div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {track.artist}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {track.album} {track.vinylSide ? `• Lado ${track.vinylSide}` : ''}
                  </div>
                </div>
              </div>

              {/* Compatibility Score */}
              <div className={`score-badge ${scoreClass}`} title={`Score: ${overallScore}/100`}>
                <div>{overallScore}</div>
                <div style={{ fontSize: '0.6rem', opacity: 0.8, textTransform: 'uppercase' }}>score</div>
              </div>
            </div>

            {/* Metrics Chips */}
            <div className="metrics-row">
              <div className="metric-pill cyan">
                <span>Pitch: {formatPitchPct(requiredPitchPct)}</span>
                <span style={{ opacity: 0.7, fontSize: '0.7rem' }}>({track.bpm} BPM)</span>
              </div>

              {track.camelotKey && (
                <div className="metric-pill green">
                  <span>Camelot {track.camelotKey}</span>
                  {track.key && <span style={{ opacity: 0.7 }}>({track.key})</span>}
                </div>
              )}

              <div className="metric-pill" style={{ color: 'var(--text-secondary)' }}>
                <span>{track.genre}</span>
              </div>

              {track.energy !== null && (
                <div className="metric-pill amber">
                  <span>Energía {track.energy}/5</span>
                </div>
              )}
            </div>

            {/* Reasons pills */}
            <div className="reasons-list">
              {reasons.slice(0, 4).map((reason, idx) => (
                <span key={idx} className="reason-tag">
                  • {reason}
                </span>
              ))}
            </div>

            {/* Warnings if any */}
            {warnings.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {warnings.map((warn, idx) => (
                  <div key={idx} className="warning-tag" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="card-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onUseAsNextTrack(track)}
              >
                <Play size={15} />
                Usar como siguiente
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => onPracticeTransition(item)}
              >
                <CheckCircle2 size={15} />
                Probé esta mezcla
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
