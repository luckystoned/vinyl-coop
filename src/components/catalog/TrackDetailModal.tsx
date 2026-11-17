// src/components/catalog/TrackDetailModal.tsx
import React from 'react';
import { X, Disc, Zap, Play, Star, Sliders, Calendar, ArrowRight } from 'lucide-react';
import { Track } from '../../types/track';
import { TrackPracticeHistory } from '../../types/catalog';
import { formatPitchPct } from '../../lib/bpm/pitch';

interface TrackDetailModalProps {
  track: Track;
  history?: TrackPracticeHistory;
  onClose: () => void;
  onSelectTrackForMix: (track: Track) => void;
}

export const TrackDetailModal: React.FC<TrackDetailModalProps> = ({
  track,
  history,
  onClose,
  onSelectTrackForMix,
}) => {
  const allTransitions = [
    ...(history?.asSource.map(t => ({ ...t, role: 'source' as const })) || []),
    ...(history?.asTarget.map(t => ({ ...t, role: 'target' as const })) || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Disc size={18} color="var(--color-cyan)" />
            <span className="modal-title">Detalle del Track</span>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Track Info */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div className="vinyl-artwork-box" style={{ width: '84px', height: '84px', flexShrink: 0 }}>
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
                <div className="vinyl-disc-placeholder">
                  <div className="vinyl-center-label">
                    <div className="vinyl-spindle-hole" />
                  </div>
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {track.track}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-cyan)', fontWeight: 600, marginTop: '2px' }}>
                {track.artist}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {track.album} {track.vinylSide ? `• Cara ${track.vinylSide}` : ''}
              </div>

              <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
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
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      color: 'var(--color-amber)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontWeight: 600,
                    }}
                  >
                    <Zap size={11} /> {track.energy}/5
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Musical Metrics */}
          <div className="metrics-row" style={{ marginTop: '4px' }}>
            <div className="metric-pill cyan">
              <span>{track.bpm ? `${track.bpm} BPM` : 'BPM desconocido'}</span>
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

          {/* Tags */}
          {track.tags && track.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {track.tags.map((t, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-muted)',
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Action Button: Cargar en Bandeja / Mezclar */}
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            onClick={() => onSelectTrackForMix(track)}
          >
            <Play size={16} style={{ fill: 'currentColor' }} />
            Cargar en Bandeja A y Mezclar
          </button>

          {/* Practice History Section */}
          <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Historial de Mezclas en Práctica
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  background: allTransitions.length > 0 ? 'rgba(0, 229, 255, 0.15)' : 'var(--bg-card)',
                  color: allTransitions.length > 0 ? 'var(--color-cyan)' : 'var(--text-muted)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 600,
                }}
              >
                {allTransitions.length} {allTransitions.length === 1 ? 'mezcla registrada' : 'mezclas registradas'}
              </span>
            </div>

            {allTransitions.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  background: 'var(--bg-app)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  border: '1px dashed var(--border-subtle)',
                }}
              >
                Este track aún no fue registrado en ninguna sesión de práctica.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allTransitions.map(tr => {
                  const isSource = tr.role === 'source';
                  const partnerTrack = isSource ? tr.target_track : tr.source_track;
                  const partnerArtist = isSource ? tr.target_artist : tr.source_artist;

                  return (
                    <div
                      key={tr.transition_id}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-app)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={11} /> {formatDate(tr.created_at)}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: isSource ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isSource ? 'var(--color-green)' : 'var(--color-amber)',
                          }}
                        >
                          {isSource ? 'Track Saliente (A)' : 'Track Entrante (B)'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '6px 0' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {isSource ? 'Hacia:' : 'Desde:'}
                        </span>
                        <ArrowRight size={12} color="var(--color-cyan)" />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {partnerTrack || 'Desconocido'}
                        </span>
                        <span style={{ color: 'var(--color-cyan)', fontSize: '0.75rem' }}>
                          ({partnerArtist})
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                          <Sliders size={11} /> Pitch: {formatPitchPct(tr.used_pitch_pct)}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          Tipo: {tr.transition_type}
                        </span>
                        {tr.rating !== null && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--color-amber)', fontSize: '0.75rem' }}>
                            <Star size={11} style={{ fill: 'currentColor' }} /> {tr.rating}/5
                          </span>
                        )}
                      </div>

                      {tr.notes && (
                        <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.02)', padding: '4px 8px', borderRadius: '4px' }}>
                          "{tr.notes}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
