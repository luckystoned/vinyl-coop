// src/components/history/SessionList.tsx
import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Play, Clock, RefreshCw } from 'lucide-react';
import { PracticeSession } from '../../types/practice';
import { SessionDetail } from './SessionDetail';

interface SessionListProps {
  sessions: PracticeSession[];
  onResumeSession: (session: PracticeSession) => void;
  onRefreshHistory: () => void;
  isLoading: boolean;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  onResumeSession,
  onRefreshHistory,
  isLoading,
}) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    sessions[0]?.sessionId || null
  );

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="section-header">
        <span className="section-title">Sesiones de práctica ({sessions.length})</span>
        <button
          type="button"
          onClick={onRefreshHistory}
          disabled={isLoading}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-cyan)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
          {isLoading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="deck-card" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)' }}>
          <Clock size={32} color="#64748b" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Aún no hay sesiones guardadas</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Practicá mezclas en el Mix Lab y registralas con "Probé esta mezcla" para verlas aquí.
          </div>
        </div>
      ) : (
        sessions.map(session => {
          const isExpanded = expandedSessionId === session.sessionId;

          return (
            <div
              key={session.sessionId}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedSessionId(isExpanded ? null : session.sessionId)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <Calendar size={13} />
                    <span>{formatDate(session.updatedAt || session.createdAt)}</span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {session.firstTrackName} → {session.lastTrackName}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {session.transitionsCount} {session.transitionsCount === 1 ? 'transición' : 'transiciones'} practicadas
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                    onClick={e => {
                      e.stopPropagation();
                      onResumeSession(session);
                    }}
                    title="Continuar agregando transiciones a esta sesión"
                  >
                    <Play size={12} />
                    Retomar
                  </button>

                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Expanded transition chain */}
              {isExpanded && <SessionDetail session={session} />}
            </div>
          );
        })
      )}
    </div>
  );
};
