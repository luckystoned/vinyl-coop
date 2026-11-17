// src/components/mixlab/PracticeModal.tsx
import React, { useState } from 'react';
import { X, Check, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Track } from '../../types/track';
import { RecommendationResult } from '../../types/recommendation';
import { TransitionType, CreateTransitionPayload } from '../../types/practice';
import { formatPitchPct } from '../../lib/bpm/pitch';

interface PracticeModalProps {
  sourceTrack: Track;
  suggestion: RecommendationResult;
  sessionId: string;
  mode: string;
  genreFilter: string;
  onClose: () => void;
  onSubmit: (payload: CreateTransitionPayload) => Promise<boolean>;
  onSuccessNextTrack: (nextTrack: Track) => void;
}

export const PracticeModal: React.FC<PracticeModalProps> = ({
  sourceTrack,
  suggestion,
  sessionId,
  mode,
  genreFilter,
  onClose,
  onSubmit,
  onSuccessNextTrack,
}) => {
  const targetTrack = suggestion.track;

  const [transitionType, setTransitionType] = useState<TransitionType>('beatmatch');
  const [usedPitchPct, setUsedPitchPct] = useState<number>(suggestion.requiredPitchPct);
  const [pitchBendPct, setPitchBendPct] = useState<string>('');
  const [rating, setRating] = useState<number | null>(4);
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate unique client token on mount
  const [clientToken] = useState<string>(
    () => `tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const parsedBend = pitchBendPct.trim() !== '' ? parseFloat(pitchBendPct) : null;

    const payload: CreateTransitionPayload = {
      client_token: clientToken,
      session_id: sessionId,
      source_track_id: sourceTrack.id,
      source_artist: sourceTrack.artist,
      source_album: sourceTrack.album,
      source_track: sourceTrack.track,
      target_track_id: targetTrack.id,
      target_artist: targetTrack.artist,
      target_album: targetTrack.album,
      target_track: targetTrack.track,
      mode,
      genre_filter: genreFilter,
      transition_type: transitionType,
      suggested_pitch_pct: suggestion.requiredPitchPct,
      used_pitch_pct: Math.round(usedPitchPct * 100) / 100,
      pitch_bend_pct: parsedBend !== null && !isNaN(parsedBend) ? Math.round(parsedBend * 100) / 100 : null,
      rating,
      notes: notes.trim(),
      recommendation_reasons: suggestion.reasons,
    };

    try {
      const ok = await onSubmit(payload);
      if (ok) {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar la transición');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-header">
          <div className="modal-title">
            {isSuccess ? '¡Mezcla registrada!' : 'Registrar práctica de mezcla'}
          </div>
          <button type="button" className="close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '2px solid var(--color-green)',
                color: 'var(--color-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <Check size={32} />
            </div>

            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Transición guardada en el historial
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {sourceTrack.track} → {targetTrack.track}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onSuccessNextTrack(targetTrack);
                  onClose();
                }}
              >
                <span>Usar {targetTrack.track} como nuevo track actual</span>
                <ArrowRight size={16} />
              </button>

              <button type="button" className="btn-secondary" onClick={onClose}>
                Quedarme en el track actual
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Visual Transition Summary */}
            <div
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Track A (Actual)
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sourceTrack.track}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {sourceTrack.artist} ({sourceTrack.bpm} BPM)
                </div>
              </div>

              <ArrowRight size={18} color="#00e5ff" style={{ flexShrink: 0 }} />

              <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Track B (Entrante)
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-cyan)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {targetTrack.track}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {targetTrack.artist} ({targetTrack.bpm} BPM)
                </div>
              </div>
            </div>

            {/* Transition Type Selector */}
            <div className="form-group">
              <label className="form-label">Tipo de transición</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {(
                  [
                    { id: 'beatmatch', label: 'Beatmatch (Larga)' },
                    { id: 'eq_mix', label: 'Mezcla por EQ' },
                    { id: 'cut', label: 'Corte directo' },
                    { id: 'other', label: 'Otro' },
                  ] as const
                ).map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`filter-pill-btn ${transitionType === opt.id ? 'active' : ''}`}
                    onClick={() => setTransitionType(opt.id)}
                    style={{ borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch Used Slider & Stepper */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Pitch realmente utilizado (Bandeja B)</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Sugerido: {formatPitchPct(suggestion.requiredPitchPct)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="range"
                  min="-8"
                  max="8"
                  step="0.05"
                  value={usedPitchPct}
                  onChange={e => setUsedPitchPct(parseFloat(e.target.value))}
                  className="pitch-slider"
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--color-cyan)',
                    fontSize: '0.9rem',
                    width: '60px',
                    textAlign: 'right',
                  }}
                >
                  {formatPitchPct(usedPitchPct)}
                </span>
              </div>
            </div>

            {/* Pitch Bend Applied (Optional) */}
            <div className="form-group">
              <label className="form-label">Pitch bend temporal aplicado (opcional)</label>
              <input
                type="number"
                step="0.1"
                placeholder="Ej. +1.5% o -0.8% si empujaste o frenaste el plato"
                value={pitchBendPct}
                onChange={e => setPitchBendPct(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Rating */}
            <div className="form-group">
              <label className="form-label">Valoración de la mezcla</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`star-btn ${rating !== null && rating >= val ? 'active' : ''}`}
                    onClick={() => setRating(val)}
                  >
                    ★
                  </button>
                ))}
                {rating !== null && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px', alignSelf: 'center' }}>
                    {rating}/5 estrellas
                  </span>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Observaciones y notas de práctica (opcional)</label>
              <textarea
                className="form-textarea"
                placeholder="¿Cómo sonaron los bombos? ¿Alineación de fase? ¿Corte de graves en qué compás?"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                maxLength={500}
              />
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', padding: '12px', marginTop: '4px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Guardando en Google Sheets...
                </>
              ) : (
                'Confirmar y guardar transición'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
