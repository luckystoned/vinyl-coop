// src/services/api.ts
import { Track } from '../types/track';
import { PracticeSession, TransitionLog, CreateTransitionPayload } from '../types/practice';
import { AuthStatus } from '../types/auth';

class ApiService {
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'same-origin',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.error || `Error ${res.status}: ${res.statusText}`;
      const err = new Error(errorMsg);
      (err as any).status = res.status;
      (err as any).data = data;
      throw err;
    }

    return data as T;
  }

  async checkAuthStatus(): Promise<AuthStatus> {
    return this.request<AuthStatus>('/api/auth-status');
  }

  async login(password: string): Promise<{ success: boolean; demoMode: boolean; sheetConfigured: boolean }> {
    return this.request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async logout(): Promise<{ success: boolean }> {
    return this.request('/api/logout', {
      method: 'POST',
    });
  }

  async fetchTracks(refresh: boolean = false): Promise<{ tracks: Track[]; count: number; demoMode: boolean }> {
    const query = refresh ? '?refresh=true' : '';
    return this.request(`/api/tracks${query}`);
  }

  async fetchSessions(): Promise<{ sessions: PracticeSession[]; demoMode: boolean }> {
    return this.request('/api/sessions');
  }

  async saveTransition(payload: CreateTransitionPayload): Promise<{
    success: boolean;
    transition: TransitionLog;
    demoMode: boolean;
  }> {
    return this.request('/api/transitions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async saveTrack(track: Track): Promise<{ success: boolean; track: Track }> {
    return this.request('/api/tracks', {
      method: 'POST',
      body: JSON.stringify(track),
    });
  }

  async deleteTrack(trackId: string): Promise<{ success: boolean }> {
    return this.request(`/api/tracks?id=${encodeURIComponent(trackId)}`, {
      method: 'DELETE',
    });
  }

  async syncSheets(): Promise<{ success: boolean; message: string; importedCount: number }> {
    return this.request('/api/sync-sheets', {
      method: 'POST',
    });
  }

  async uploadCover(imageBase64: string, mimeType: string): Promise<{ success: boolean; url: string }> {
    return this.request('/api/upload-cover', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, mimeType }),
    });
  }
}

export const api = new ApiService();
