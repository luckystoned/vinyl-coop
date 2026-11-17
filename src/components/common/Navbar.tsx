// src/components/common/Navbar.tsx
import React from 'react';
import { Disc, History, Sliders, LogOut } from 'lucide-react';

interface NavbarProps {
  currentTab: 'mixer' | 'history';
  onSelectTab: (tab: 'mixer' | 'history') => void;
  onLogout: () => void;
  transitionsInSession?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  transitionsInSession = 0,
}) => {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon">
          <Disc size={18} color="#00e5ff" />
        </div>
        <div className="brand-title">
          Vinyl Coop
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          type="button"
          className={`nav-tab-btn ${currentTab === 'mixer' ? 'active' : ''}`}
          onClick={() => onSelectTab('mixer')}
        >
          <Sliders size={15} />
          Mezclar
        </button>
        <button
          type="button"
          className={`nav-tab-btn ${currentTab === 'history' ? 'active' : ''}`}
          onClick={() => onSelectTab('history')}
        >
          <History size={15} />
          Historial
          {transitionsInSession > 0 && (
            <span
              style={{
                background: 'rgba(0, 229, 255, 0.2)',
                color: '#00e5ff',
                borderRadius: '10px',
                padding: '0 5px',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
              }}
            >
              {transitionsInSession}
            </span>
          )}
        </button>
      </nav>

      <button
        type="button"
        onClick={onLogout}
        title="Cerrar sesión"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <LogOut size={18} />
      </button>
    </header>
  );
};
