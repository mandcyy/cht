import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get('/api/auth/me')
      .then(r => setUser(r.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const r = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
  }, []);

  const register = useCallback(async (username, password, displayName) => {
    const r = await api.post('/api/auth/register', { username, password, displayName });
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  // Update local user state (e.g. after avatar/profile change)
  const updateUser = useCallback((patch) => {
    setUser(u => u ? { ...u, ...patch } : u);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
