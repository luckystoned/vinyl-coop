// src/components/catalog/AlbumCard.tsx
import React, { useState } from 'react';
import { Disc, ChevronDown, ChevronUp, History, Play } from 'lucide-react';
import { AlbumRelease, TrackPracticeHistory } from '../../types/catalog';
import { Track } from '../../types/track';

interface AlbumCardProps {
  release: AlbumRelease;
  historyMap: Map<string, TrackPracticeHistory>;
  onSelectTrack: (track: Track) => void;
  onOpenTrackDetail: (track: Track) => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({
  release,
  historyMap,
  onSelectTrack,
  onOpenTrackDetail,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Check how many tracks in this release have practice history
  let totalPracticesInAlbum = 0;
  for (const side of release.sides) {
    for (const track of side.tracks) {
      const hist = historyMap.get(track.id);
      if (hist && hist.totalCount > 0) {
        totalPracticesInAlbum += hist.totalCount;
      }
    }
  }

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Header / Clickable Release Overview */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          gap: '12px',
          padding: '12px',
          cursor: 'pointer',
          alignItems: 'center',
        }}
      >
        <div
          className="vinyl-artwork-box"
          style={{ width: '64px', height: '64px', flexShrink: 0, borderRadius: 'var(--radius-sm)' }}
        >
          {release.coverUrl ? (
            <img
              src={release.coverUrl}
              alt={release.album}
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
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={release.album}
          >
            {release.album}
          </div>
          <div
            style={{
              fontSize: '0.82rem',
              color: 'var(--color-cyan)',
              fontWeight: 600,
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={release.artist}
          >
            {release.artist}
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                background: 'var(--bg-app)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {release.totalTracks} {release.totalTracks === 1 ? 'track' : 'tracks'} ({release.sides.length} {release.sides.length === 1 ? 'cara' : 'caras'})
            </span>

            {release.genres.slice(0, 2).map((g, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-app)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {g}
              </span>
            ))}

            {totalPracticesInAlbum > 0 && (
              <span
                style={{
                  fontSize: '0.68rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: 'var(--color-amber)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                <History size={10} />
                {totalPracticesInAlbum} en historial
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
          aria-label={isExpanded ? 'Colapsar vinilo' : 'Expandir vinilo'}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Expanded Tracks List */}
      {isExpanded && (
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-app)',
            padding: '8px 12px 14px',
          }}
        >
          {release.sides.map(sideGroup => (
            <div key={sideGroup.side} style={{ marginTop: '8px' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-orange)',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Disc size={12} /> LADO {sideGroup.side}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sideGroup.tracks.map(t => {
                  const trackHist = historyMap.get(t.id);
                  const hasHistory = trackHist && trackHist.totalCount > 0;

                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        gap: '8px',
                      }}
                    >
                      <div
                        onClick={() => onOpenTrackDetail(t)}
                        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {t.track}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '3px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>
                            {t.bpm ? `${t.bpm} BPM` : 'BPM ?'}
                          </span>
                          {t.camelotKey && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-green)', fontFamily: 'var(--font-mono)' }}>
                              {t.camelotKey}
                            </span>
                          )}
                          {hasHistory && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                color: 'var(--color-amber)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                padding: '1px 5px',
                                borderRadius: '3px',
                              }}
                            >
                              <History size={9} /> {trackHist.totalCount} {trackHist.totalCount === 1 ? 'mezcla' : 'mezclas'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => onOpenTrackDetail(t)}
                          style={{
                            padding: '5px 8px',
                            fontSize: '0.75rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)',
                          }}
                          title="Ver detalle e historial"
                        >
                          Info
                        </button>

                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => onSelectTrack(t)}
                          style={{
                            padding: '5px 10px',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Cargar en Bandeja A y mezclar"
                        >
                          <Play size={11} style={{ fill: 'currentColor' }} />
                          Mezclar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
