import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MwcSettings } from '../db/schema';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  settings: MwcSettings | null;
  loading: boolean;
  reloadSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [settings, setSettings] = useState<MwcSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      // If we have token, fetch from authenticated route; otherwise fetch from public route
      const url = token ? '/api/settings' : '/api/public/settings';
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(url, { headers });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSettings(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to load MWC NU settings:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const reloadSettings = async () => {
    await fetchSettings();
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, reloadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
