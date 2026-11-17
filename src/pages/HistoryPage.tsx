// src/pages/HistoryPage.tsx
import React, { useEffect, useState } from 'react';
import { PracticeSession } from '../types/practice';
import { Track } from '../types/track';
import { api } from '../services/api';
import { SessionList } from '../components/history/SessionList';

interface HistoryPageProps {
  tracks: Track[];
  onResumeSession: (sessionId: string, lastTrack: Track | null) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ tracks, onResumeSession }) => {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const res = await api.fetchSessions();
      setSessions(res.sessions || []);
    } catch (err) {
      console.error('Error loading practice sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleResumeSession = (session: PracticeSession) => {
    // Find the last track object from inventory if possible
    const lastTransition = session.transitions[session.transitions.length - 1];
    const targetTrackId = lastTransition?.target_track_id;
    const foundTrack = targetTrackId ? tracks.find(t => t.id === targetTrackId) : null;

    onResumeSession(session.sessionId, foundTrack || null);
  };

  return (
    <main className="lab-content">
      <SessionList
        sessions={sessions}
        onResumeSession={handleResumeSession}
        onRefreshHistory={loadSessions}
        isLoading={isLoading}
      />
    </main>
  );
};
