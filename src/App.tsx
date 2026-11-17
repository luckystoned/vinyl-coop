// src/App.tsx
import { useState, useEffect } from 'react';
import { Track } from './types/track';
import { api } from './services/api';
import { Navbar } from './components/common/Navbar';
import { DemoBanner } from './components/common/DemoBanner';
import { MixLabPage } from './pages/MixLabPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';
import { Loader2 } from 'lucide-react';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);

  const [currentTab, setCurrentTab] = useState<'mixlab' | 'history'>('mixlab');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  // Active practice session
  const [sessionId, setSessionId] = useState<string>(() => {
    return sessionStorage.getItem('vc_session_id') || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  });
  const [transitionsInSession, setTransitionsInSession] = useState<number>(0);

  // Persist session ID in tab storage
  useEffect(() => {
    sessionStorage.setItem('vc_session_id', sessionId);
  }, [sessionId]);

  // Initial Auth Check
  useEffect(() => {
    async function verifyAuth() {
      try {
        const status = await api.checkAuthStatus();
        setIsAuthenticated(status.authenticated);
        setDemoMode(status.demoMode);
        if (status.authenticated) {
          loadInventory();
        }
      } catch {
        setIsAuthenticated(false);
      }
    }
    verifyAuth();
  }, []);

  const loadInventory = async (forceRefresh: boolean = false) => {
    setIsLoadingTracks(true);
    try {
      const res = await api.fetchTracks(forceRefresh);
      setTracks(res.tracks || []);
      setDemoMode(res.demoMode);

      // If no track is currently playing, set the first track as initial point
      if (!currentTrack && res.tracks && res.tracks.length > 0) {
        setCurrentTrack(res.tracks[0]);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleLoginSuccess = (status: { demoMode: boolean; sheetConfigured: boolean }) => {
    setIsAuthenticated(true);
    setDemoMode(status.demoMode);
    loadInventory();
  };

  const handleLogout = async () => {
    await api.logout().catch(() => {});
    setIsAuthenticated(false);
  };

  const handleNewSession = () => {
    const newId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setSessionId(newId);
    setTransitionsInSession(0);
  };

  const handleResumeSession = (resumedSessionId: string, lastTrack: Track | null) => {
    setSessionId(resumedSessionId);
    if (lastTrack) {
      setCurrentTrack(lastTrack);
    }
    setCurrentTab('mixlab');
  };

  // Loading initial auth state
  if (isAuthenticated === null) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)',
          color: 'var(--color-cyan)',
        }}
      >
        <Loader2 size={36} className="spin" />
      </div>
    );
  }

  // Unauthenticated screen
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <DemoBanner demoMode={demoMode} />

      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onLogout={handleLogout}
        activeSessionId={sessionId}
        transitionsInSession={transitionsInSession}
      />

      {currentTab === 'mixlab' ? (
        <MixLabPage
          tracks={tracks}
          currentTrack={currentTrack}
          onSelectTrack={setCurrentTrack}
          sessionId={sessionId}
          onNewSession={handleNewSession}
          transitionsInSession={transitionsInSession}
          onTransitionLogged={() => setTransitionsInSession(prev => prev + 1)}
          onRefreshCollection={() => loadInventory(true)}
          isRefreshing={isLoadingTracks}
        />
      ) : (
        <HistoryPage
          tracks={tracks}
          onResumeSession={handleResumeSession}
        />
      )}
    </div>
  );
}
export default App;
