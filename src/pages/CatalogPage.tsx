// src/pages/CatalogPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Disc, Filter, RefreshCw, X, Loader2, Plus, Download, CheckCircle2 } from 'lucide-react';
import { Track } from '../types/track';
import { PracticeSession } from '../types/practice';
import { api } from '../services/api';
import { groupTracksByAlbum, buildTrackHistoryMap } from '../lib/catalog/grouping';
import { AlbumCard } from '../components/catalog/AlbumCard';
import { TrackDetailModal } from '../components/catalog/TrackDetailModal';
import { TrackEditModal } from '../components/catalog/TrackEditModal';

interface CatalogPageProps {
  tracks: Track[];
  onSelectTrackForMix: (track: Track) => void;
  onRefreshCollection: () => void;
  isRefreshing?: boolean;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  tracks,
  onSelectTrackForMix,
  onRefreshCollection,
  isRefreshing = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [filterTestedOnly, setFilterTestedOnly] = useState<boolean>(false);
  const [activeModalTrack, setActiveModalTrack] = useState<Track | null>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null | undefined>(undefined); // undefined: closed, null: new, Track: editing
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Sessions practice history for badge and history lookups
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);

  useEffect(() => {
    async function loadSessions() {
      setIsLoadingHistory(true);
      try {
        const res = await api.fetchSessions();
        setSessions(res.sessions || []);
      } catch (err) {
        console.error('Error fetching sessions for catalog:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    loadSessions();
  }, []);

  const historyMap = useMemo(() => {
    return buildTrackHistoryMap(sessions);
  }, [sessions]);

  // Group all tracks by album
  const allReleases = useMemo(() => {
    return groupTracksByAlbum(tracks);
  }, [tracks]);

  // Extract unique genres for filter bar
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    for (const t of tracks) {
      if (t.genre) set.add(t.genre);
    }
    return Array.from(set).sort();
  }, [tracks]);

  // Filtered releases based on search query, genre, and tested-only flag
  const filteredReleases = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return allReleases.filter(release => {
      // 1. Genre filter
      if (selectedGenre !== 'all' && !release.genres.includes(selectedGenre)) {
        return false;
      }

      // 2. Tested only filter
      if (filterTestedOnly) {
        const hasTestedTrack = release.sides.some(side =>
          side.tracks.some(track => {
            const hist = historyMap.get(track.id);
            return hist && hist.totalCount > 0;
          })
        );
        if (!hasTestedTrack) return false;
      }

      // 3. Text search
      if (!q) return true;

      const matchesAlbum = release.album.toLowerCase().includes(q);
      const matchesArtist = release.artist.toLowerCase().includes(q);
      const matchesTrack = release.sides.some(side =>
        side.tracks.some(t => t.track.toLowerCase().includes(q))
      );

      return matchesAlbum || matchesArtist || matchesTrack;
    });
  }, [allReleases, searchQuery, selectedGenre, filterTestedOnly, historyMap]);

  const handleSyncSheets = async () => {
    setIsSyncingSheets(true);
    setSyncStatusMsg(null);
    try {
      const res = await api.syncSheets();
      setSyncStatusMsg(res.message);
      onRefreshCollection();
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch (err: any) {
      setSyncStatusMsg(err.message || 'Error al sincronizar desde Google Sheets');
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  return (
    <main className="main-content">
      {/* Header Bar */}
      <div className="section-header" style={{ marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Disc size={18} color="var(--color-cyan)" />
          <span className="section-title">
            Catálogo por Disco ({filteredReleases.length}{filteredReleases.length !== allReleases.length ? ` de ${allReleases.length}` : ''})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Sync Sheets Button */}
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSyncSheets}
            disabled={isSyncingSheets || isRefreshing}
            style={{ padding: '6px 10px', fontSize: '0.78rem', gap: '6px' }}
            title="Re-importar y sincronizar stock desde Google Sheets"
          >
            {isSyncingSheets ? (
              <Loader2 size={13} className="spin" />
            ) : (
              <Download size={13} color="var(--color-green)" />
            )}
            {isSyncingSheets ? 'Sincronizando...' : 'Importar Sheets'}
          </button>

          {/* Add New Vinyl Button */}
          <button
            type="button"
            className="btn-primary"
            onClick={() => setEditingTrack(null)}
            style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
          >
            <Plus size={14} />
            + Nuevo Vinilo
          </button>

          {/* Refresh Supabase List */}
          <button
            type="button"
            onClick={onRefreshCollection}
            disabled={isRefreshing || isSyncingSheets}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-cyan)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              opacity: isRefreshing ? 0.6 : 1,
            }}
            title="Recargar catálogo desde Supabase"
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin' : ''} />
            {isRefreshing ? 'Cargando...' : 'Recargar'}
          </button>
        </div>
      </div>

      {syncStatusMsg && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
            border: '1px solid var(--color-cyan)',
            borderRadius: '8px',
            color: 'var(--color-cyan)',
            fontSize: '0.82rem',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          {syncStatusMsg}
        </div>
      )}

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          className="form-input"
          placeholder="Buscar por álbum, artista o título de track..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: '36px',
            paddingRight: searchQuery ? '36px' : '12px',
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Chips / Quick Filter Row */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px' }}>
        <button
          type="button"
          onClick={() => setFilterTestedOnly(!filterTestedOnly)}
          style={{
            whiteSpace: 'nowrap',
            padding: '5px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
            border: '1px solid',
            borderColor: filterTestedOnly ? 'var(--color-amber)' : 'var(--border-subtle)',
            background: filterTestedOnly ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card)',
            color: filterTestedOnly ? 'var(--color-amber)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Filter size={11} />
          Solo probados
        </button>

        <button
          type="button"
          onClick={() => setSelectedGenre('all')}
          style={{
            whiteSpace: 'nowrap',
            padding: '5px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
            border: '1px solid',
            borderColor: selectedGenre === 'all' ? 'var(--color-cyan)' : 'var(--border-subtle)',
            background: selectedGenre === 'all' ? 'rgba(0, 229, 255, 0.15)' : 'var(--bg-card)',
            color: selectedGenre === 'all' ? 'var(--color-cyan)' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          Todos los géneros
        </button>

        {availableGenres.map(genre => (
          <button
            key={genre}
            type="button"
            onClick={() => setSelectedGenre(selectedGenre === genre ? 'all' : genre)}
            style={{
              whiteSpace: 'nowrap',
              padding: '5px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: '1px solid',
              borderColor: selectedGenre === genre ? 'var(--color-cyan)' : 'var(--border-subtle)',
              background: selectedGenre === genre ? 'rgba(0, 229, 255, 0.15)' : 'var(--bg-card)',
              color: selectedGenre === genre ? 'var(--color-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Releases List */}
      {isLoadingHistory && sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px', color: 'var(--color-cyan)' }} />
          Cargando datos del catálogo...
        </div>
      ) : filteredReleases.length === 0 ? (
        <div
          style={{
            padding: '36px 16px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          <Disc size={36} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No se encontraron vinilos</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Probá ajustando la búsqueda o quitando los filtros de género
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredReleases.map(release => (
            <AlbumCard
              key={release.id}
              release={release}
              historyMap={historyMap}
              onSelectTrack={onSelectTrackForMix}
              onOpenTrackDetail={track => setActiveModalTrack(track)}
              onEditTrack={track => setEditingTrack(track)}
            />
          ))}
        </div>
      )}

      {/* Modal for Track Detail & History */}
      {activeModalTrack && (
        <TrackDetailModal
          track={activeModalTrack}
          history={historyMap.get(activeModalTrack.id)}
          onClose={() => setActiveModalTrack(null)}
          onSelectTrackForMix={track => {
            setActiveModalTrack(null);
            onSelectTrackForMix(track);
          }}
          onEditTrack={track => setEditingTrack(track)}
        />
      )}

      {/* Modal for Creating or Editing Track */}
      {editingTrack !== undefined && (
        <TrackEditModal
          track={editingTrack}
          onClose={() => setEditingTrack(undefined)}
          onSaved={() => {
            onRefreshCollection();
          }}
          onDeleted={() => {
            onRefreshCollection();
          }}
        />
      )}
    </main>
  );
};
