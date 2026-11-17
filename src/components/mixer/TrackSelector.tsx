// src/components/mixer/TrackSelector.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Disc } from 'lucide-react';
import { Track } from '../../types/track';

interface TrackSelectorProps {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  currentTrackId?: string;
}

export const TrackSelector: React.FC<TrackSelectorProps> = ({
  tracks,
  onSelectTrack,
  currentTrackId,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query.trim()
    ? tracks.filter(t => {
        const q = query.toLowerCase();
        return (
          t.track.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q) ||
          t.tags.some(tag => tag.toLowerCase().includes(q))
        );
      }).slice(0, 10)
    : [];

  return (
    <div className="search-container" ref={containerRef}>
      <div className="search-input-wrapper">
        <Search className="search-input-icon" size={18} />
        <input
          type="text"
          className="search-input"
          placeholder="Buscar vinilo por artista, álbum o track..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="search-dropdown">
          {filtered.map(t => {
            const isSelected = t.id === currentTrackId;
            return (
              <div
                key={t.id}
                className="search-result-item"
                style={{
                  background: isSelected ? 'rgba(0, 229, 255, 0.08)' : undefined,
                }}
                onClick={() => {
                  onSelectTrack(t);
                  setIsOpen(false);
                  setQuery('');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#1a1d28',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Disc size={16} color={isSelected ? '#00e5ff' : '#94a3b8'} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: isSelected ? 'var(--color-cyan)' : 'var(--text-primary)',
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
                      {t.artist} — {t.album} {t.vinylSide ? `(${t.vinylSide})` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                  {t.bpm && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        color: 'var(--color-cyan)',
                      }}
                    >
                      {t.bpm} BPM
                    </span>
                  )}
                  {t.camelotKey && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        color: 'var(--color-green)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}
                    >
                      {t.camelotKey}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
