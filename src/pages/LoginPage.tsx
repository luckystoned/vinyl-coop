// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Disc, Lock, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (status: { demoMode: boolean; sheetConfigured: boolean }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.login(password);
      if (res.success) {
        onLoginSuccess({
          demoMode: res.demoMode,
          sheetConfigured: res.sheetConfigured,
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al autenticar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'var(--bg-app)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div className="brand-icon" style={{ width: '48px', height: '48px' }}>
            <Disc size={26} color="#00e5ff" />
          </div>

          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            Vinyl Coop
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Asistente de selección y práctica para vinilos físicos
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Contraseña de acceso</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '38px', width: '100%' }}
                placeholder="Ingresá la contraseña privada"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading || !password.trim()}
            style={{ width: '100%', padding: '12px', marginTop: '6px' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spin" />
                Ingresando...
              </>
            ) : (
              'Entrar al Lab'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Configurada por variable de entorno <code>APP_PASSWORD</code>
        </div>
      </div>
    </div>
  );
};
