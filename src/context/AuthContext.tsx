/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: 'Super Admin' | 'Ketua MWC' | 'Sekretaris' | 'Bendahara' | 'Operator' | 'Admin Ranting' | 'Admin Banom' | 'Viewer';
  ranting_id: number | null;
  banom_id: number | null;
  ranting_name?: string | null;
  banom_name?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  isScopeAllowed: (rantingId: number | null, banomId: number | null) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('simmwc_token'));
  const [loading, setLoading] = useState<boolean>(true);

  // Validate active token on mount or token change
  useEffect(() => {
    async function fetchMe() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();
        if (result.success && result.data) {
          setUser(result.data);
        } else {
          // Token is invalid, clean up
          localStorage.removeItem('simmwc_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to verify session:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, [token]);

  // Execute credentials submission
  const login = async (email: string, password?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      if (result.success && result.data) {
        const userToken = result.data.token;
        localStorage.setItem('simmwc_token', userToken);
        setToken(userToken);
        setUser(result.data.user);
        return true;
      } else {
        throw new Error(result.message || 'Kredensial salah.');
      }
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  // Sign out and clear cache
  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (e) {
        console.error('Logout request failed:', e);
      }
    }
    localStorage.removeItem('simmwc_token');
    setToken(null);
    setUser(null);
  };

  // Check role helper
  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Check if current user is allowed to mutate/view specific ranting or banom
  const isScopeAllowed = (rantingId: number | null, banomId: number | null): boolean => {
    if (!user) return false;
    if (['Super Admin', 'Ketua MWC', 'Sekretaris', 'Bendahara', 'Operator'].includes(user.role)) {
      return true;
    }
    if (user.role === 'Admin Ranting') {
      return rantingId !== null && user.ranting_id === rantingId;
    }
    if (user.role === 'Admin Banom') {
      return banomId !== null && user.banom_id === banomId;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole, isScopeAllowed }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
