// src/components/mixlab/IncompleteList.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, HelpCircle, Play } from 'lucide-react';
import { Track } from '../../types/track';

interface IncompleteListProps {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
}

export const IncompleteList: React.FC<IncompleteListProps> = ({ tracks, onSelectTrack }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (tracks.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={15} color="#94a3b8" />
          <span>Alternativas con datos incompletos ({tracks.length})</span>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {isOpen && (
        <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Estos vinilos no poseen BPM registrado en el inventario y se excluyen del ranking preciso.
          </div>

          {tracks.map(t => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-sm)',
                gap: '10px',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {t.track}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {t.artist} • {t.genre} {t.vinylSide ? `(Lado ${t.vinylSide})` : ''}
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                onClick={() => onSelectTrack(t)}
              >
                <Play size={12} />
                Elegir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
