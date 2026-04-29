import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const Ctx = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket,    setSocket]    = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      setSocket(s => { s?.disconnect(); return null; });
      setConnected(false);
      return;
    }

    const token = localStorage.getItem('token');

    // Connect via Vite proxy (ws: true in vite.config.js handles the upgrade)
    const s = io('http://localhost:4000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      timeout: 10000,
    });

    s.on('connect',       () => { console.log('[socket] ✅ connected', s.id); setConnected(true); });
    s.on('disconnect',    (r) => { console.log('[socket] ❌ disconnected:', r); setConnected(false); });
    s.on('connect_error', (e) => { console.error('[socket] connect_error:', e.message); });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [user]);

  return <Ctx.Provider value={{ socket, connected }}>{children}</Ctx.Provider>;
}

export const useSocket = () => useContext(Ctx);
