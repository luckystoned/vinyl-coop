// src/components/catalog/TrackEditModal.tsx
import React, { useState, useRef } from 'react';
import { X, Disc, Camera, Upload, Trash2, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { Track, Genre } from '../../types/track';
import { api } from '../../services/api';
import { MUSICAL_KEYS, keyToCamelot } from '../../lib/camelot/musicalKeys';
import { slugify } from '../../lib/normalization/inventory';

interface TrackEditModalProps {
  track: Track | null; // null means creating a new vinyl/track
  onClose: () => void;
  onSaved: (savedTrack: Track) => void;
  onDeleted?: (trackId: string) => void;
}

const GENRES: Genre[] = [
  'Techno',
  'House',
  'Electro',
  'Breaks / UK Bass',
  'IDM / Experimental',
  'Ambient / Downtempo',
  'Disco / Indie Dance',
  'Rock',
  'Pop',
  'Soul / R&B',
  'Hip-Hop',
  'Jazz / Fusion',
  'Folk',
  'Other',
];

export const TrackEditModal: React.FC<TrackEditModalProps> = ({
  track,
  onClose,
  onSaved,
  onDeleted,
}) => {
  const isEditing = Boolean(track);

  // Form states
  const [artist, setArtist] = useState(track?.artist || '');
  const [album, setAlbum] = useState(track?.album || '');
  const [title, setTitle] = useState(track?.track || '');
  const [vinylSide, setVinylSide] = useState(track?.vinylSide || 'A');
  const [bpm, setBpm] = useState<string>(track?.bpm ? track.bpm.toString() : '');
  const [musicalKey, setMusicalKey] = useState(track?.key || '');
  const [camelotKey, setCamelotKey] = useState(track?.camelotKey || '');
  const [energy, setEnergy] = useState<number | null>(track?.energy ?? 3);
  const [genre, setGenre] = useState<string>(track?.genre || 'Techno');
  const [djUse, setDjUse] = useState(track?.djUse || '');
  const [tags, setTags] = useState(track?.tags?.join(', ') || '');
  const [coverUrl, setCoverUrl] = useState(track?.coverUrl || '');

  // Uploading / Camera state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Handle musical key selection and auto-update Camelot
  const handleKeyChange = (selectedKey: string) => {
    setMusicalKey(selectedKey);
    const calculatedCamelot = keyToCamelot(selectedKey);
    if (calculatedCamelot) {
      setCamelotKey(calculatedCamelot);
    }
  };

  // Handle photo file from camera or file picker
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setError(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const uploadRes = await api.uploadCover(base64, file.type || 'image/jpeg');
          if (uploadRes.success && uploadRes.url) {
            setCoverUrl(uploadRes.url);
          }
        } catch (uploadErr: any) {
          setError(uploadErr.message || 'Error al subir la imagen');
        } finally {
          setIsUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la foto');
      setIsUploadingPhoto(false);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist.trim() || !title.trim()) {
      setError('Artista y Título del track son obligatorios.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const parsedBpm = bpm.trim() ? parseFloat(bpm.trim()) : null;
      const parsedTags = tags
        .split(/[,;/]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      // Generate deterministic ID if creating new
      const trackId =
        track?.id ||
        `${slugify(artist)}__${slugify(album || 'single')}__${slugify(title)}__${slugify(vinylSide || 'a')}`;

      const trackPayload: Track = {
        id: trackId,
        artist: artist.trim(),
        album: (album || 'Single').trim(),
        track: title.trim(),
        vinylSide: vinylSide.trim() || 'A',
        bpm: parsedBpm && !isNaN(parsedBpm) ? Math.round(parsedBpm * 100) / 100 : null,
        key: musicalKey.trim(),
        camelotKey: camelotKey.trim() || null,
        energy,
        genre,
        djUse: djUse.trim(),
        tags: parsedTags,
        coverUrl: coverUrl.trim() || null,
      };

      const res = await api.saveTrack(trackPayload);
      if (res.success) {
        onSaved(res.track);
        onClose();
      }
    } catch (err: any) {
      console.error('Error saving track:', err);
      setError(err.message || 'Error al guardar el vinilo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!track?.id || !onDeleted) return;
    if (!window.confirm(`¿Seguro que deseas eliminar "${track.artist} - ${track.track}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.deleteTrack(track.id);
      onDeleted(track.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar track');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Disc size={18} color="var(--color-cyan)" />
            <span className="modal-title">
              {isEditing ? 'Editar Vinilo / Track' : 'Agregar Nuevo Vinilo'}
            </span>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 68, 68, 0.15)',
              border: '1px solid rgba(255, 68, 68, 0.4)',
              borderRadius: '8px',
              color: '#ff6b6b',
              fontSize: '0.82rem',
              marginBottom: '12px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Cover photo section with Camera & Upload buttons */}
          <div
            style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="vinyl-artwork-box"
              style={{
                width: '84px',
                height: '84px',
                flexShrink: 0,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Carátula"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <ImageIcon size={32} color="var(--text-muted)" style={{ opacity: 0.5 }} />
              )}
              {isUploadingPhoto && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Loader2 size={24} className="spin" color="var(--color-cyan)" />
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Carátula del Vinilo
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {/* Camera Trigger */}
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isUploadingPhoto}
                  onClick={() => cameraInputRef.current?.click()}
                  style={{ padding: '6px 10px', fontSize: '0.78rem', gap: '6px' }}
                >
                  <Camera size={14} color="var(--color-cyan)" />
                  Tomar Foto
                </button>

                {/* Upload File Trigger */}
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isUploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '6px 10px', fontSize: '0.78rem', gap: '6px' }}
                >
                  <Upload size={14} />
                  Subir Archivo
                </button>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <div style={{ marginTop: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="O pega URL directa de imagen..."
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  style={{ fontSize: '0.75rem', padding: '6px 8px' }}
                />
              </div>
            </div>
          </div>

          {/* Artist & Album */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Artista *
              </label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej: Aphex Twin"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Álbum / Release
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Selected Ambient Works"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
              />
            </div>
          </div>

          {/* Track title & Vinyl Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Título del Track *
              </label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej: Ptolemy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Lado Vinilo
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: A, B, A1"
                value={vinylSide}
                onChange={(e) => setVinylSide(e.target.value)}
              />
            </div>
          </div>

          {/* Genre & Energy */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Género Principal
              </label>
              <select
                className="form-input"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Energía (1 al 5)
              </label>
              <div style={{ display: 'flex', gap: '6px', height: '36px', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEnergy(lvl)}
                    style={{
                      flex: 1,
                      height: '100%',
                      backgroundColor: energy === lvl ? 'var(--color-cyan)' : 'var(--bg-card)',
                      color: energy === lvl ? '#0a0d14' : 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* BPM, Key & Camelot Key */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                BPM
              </label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="Ej: 126.0"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Tonalidad Musical
              </label>
              <select
                className="form-input"
                value={musicalKey}
                onChange={(e) => handleKeyChange(e.target.value)}
              >
                <option value="">(Desconocida)</option>
                {MUSICAL_KEYS.map((k) => (
                  <option key={`${k.key}-${k.camelot}`} value={k.key}>
                    {k.key} ({k.camelot})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Camelot Key
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: 8A"
                value={camelotKey}
                onChange={(e) => setCamelotKey(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          {/* DJ Use & Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                DJ Use (Función)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: warmup, peak-time, tool"
                value={djUse}
                onChange={(e) => setDjUse(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Tags (separados por coma)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: acid, bailable, hypnotic"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          {/* Footer actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: isEditing ? 'space-between' : 'flex-end',
              alignItems: 'center',
              marginTop: '10px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {isEditing && onDeleted && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff6b6b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                }}
              >
                <Trash2 size={15} />
                {isDeleting ? 'Eliminando...' : 'Eliminar Vinilo'}
              </button>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving || isUploadingPhoto}
                style={{ minWidth: '120px' }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={15} className="spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Check size={15} /> {isEditing ? 'Guardar Cambios' : 'Crear Vinilo'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
