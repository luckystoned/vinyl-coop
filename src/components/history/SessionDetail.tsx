// src/components/history/SessionDetail.tsx
import React from 'react';
import { ArrowDown } from 'lucide-react';
import { PracticeSession } from '../../types/practice';
import { formatPitchPct } from '../../lib/bpm/pitch';

interface SessionDetailProps {
  session: PracticeSession;
}

export const SessionDetail: React.FC<SessionDetailProps> = ({ session }) => {
  if (session.transitions.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '12px' }}>
        No hay transiciones registradas en esta sesión.
      </div>
    );
  }

  return (
    <div className="history-sequence">
      {/* Starting Track */}
      <div className="history-step" style={{ borderLeft: '3px solid var(--color-cyan)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-cyan)', textTransform: 'uppercase', fontWeight: 700 }}>
          Punto de partida
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          {session.transitions[0].source_track}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {session.transitions[0].source_artist} • {session.transitions[0].source_album}
        </div>
      </div>

      {/* Subsequent transitions */}
      {session.transitions.map((t, idx) => (
        <React.Fragment key={t.transition_id || idx}>
          <div className="sequence-arrow">
            <ArrowDown size={18} />
          </div>

          <div className="history-step">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {t.target_track}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {t.target_artist} • {t.target_album}
                </div>
              </div>

              {t.rating !== null && (
                <div style={{ display: 'flex', color: 'var(--color-amber)', fontSize: '0.9rem' }}>
                  {'★'.repeat(t.rating)}
                  <span style={{ color: '#33384a' }}>{'★'.repeat(5 - t.rating)}</span>
                </div>
              )}
            </div>

            {/* Metrics Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              <span className="metric-pill" style={{ fontSize: '0.75rem' }}>
                {t.transition_type.toUpperCase()}
              </span>

              <span className="metric-pill cyan" style={{ fontSize: '0.75rem' }}>
                Pitch: {formatPitchPct(t.used_pitch_pct)}
              </span>

              {t.pitch_bend_pct !== null && (
                <span className="metric-pill amber" style={{ fontSize: '0.75rem' }}>
                  Bend: {formatPitchPct(t.pitch_bend_pct)}
                </span>
              )}
            </div>

            {/* Notes if any */}
            {t.notes && (
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-app)',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  fontStyle: 'italic',
                }}
              >
                "{t.notes}"
              </div>
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
