/**
 * ChatStoreContext — global persistent message store.
 *
 * Menangani 3 hal:
 * 1. message:new     → append ke store, update unread badge
 * 2. messages:pending → pesan yang dikirim saat user offline, diterima saat reconnect
 * 3. history         → pesan historis dari server saat join room pertama kali
 */
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth }   from './AuthContext';

const Ctx = createContext(null);

export function ChatStoreProvider({ children }) {
  const { socket, connected } = useSocket();
  const { user } = useAuth();

  // { [roomId]: Message[] }
  const [msgMap, setMsgMap] = useState({});
  // { [contactId]: number }
  const [unread, setUnread] = useState({});

  const activeRoomRef    = useRef(null);  // roomId yang sedang dibuka
  const activeContactRef = useRef(null);  // contactId yang sedang dibuka

  // ── Helper: merge messages (no duplicates by id) ──────────────────
  const mergeMessages = useCallback((existing, incoming) => {
    if (!incoming.length) return existing;
    const ids = new Set(existing.map(m => m.id));
    const newOnes = incoming.filter(m => !ids.has(m.id));
    if (!newOnes.length) return existing;
    return [...existing, ...newOnes].sort((a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
    );
  }, []);

  // ── Append single message, update unread ──────────────────────────
  const appendMessage = useCallback((msg) => {
    const { roomId, senderId } = msg;

    setMsgMap(prev => ({
      ...prev,
      [roomId]: mergeMessages(prev[roomId] || [], [msg]),
    }));

    // Only increment unread if:
    // - message is from someone else
    // - this room is NOT currently active
    if (user && senderId !== user.id && activeRoomRef.current !== roomId) {
      setUnread(prev => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1,
      }));
    }
  }, [user, mergeMessages]);

  // ── Load history (from room:join ack) ─────────────────────────────
  const loadHistory = useCallback((roomId, messages) => {
    if (!messages || !messages.length) return;
    setMsgMap(prev => ({
      ...prev,
      [roomId]: mergeMessages(prev[roomId] || [], messages),
    }));
  }, [mergeMessages]);

  // ── Socket listeners ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !connected || !user) return;

    // New message (real-time)
    const onNew = (msg) => appendMessage(msg);

    // Pending messages delivered on reconnect
    // Server sends { roomId, messages: Message[] }
    const onPending = ({ roomId, messages }) => {
      if (!messages?.length) return;
      console.log(`[store] Received ${messages.length} pending msgs for room ${roomId}`);

      setMsgMap(prev => ({
        ...prev,
        [roomId]: mergeMessages(prev[roomId] || [], messages),
      }));

      // Figure out contactId from messages senderId (who sent them)
      const contactId = messages.find(m => m.senderId !== user.id)?.senderId;
      if (contactId && activeRoomRef.current !== roomId) {
        // Count only messages we haven't seen (all of them since we were offline)
        const newCount = messages.filter(m => m.senderId !== user.id).length;
        if (newCount > 0) {
          setUnread(prev => ({
            ...prev,
            [contactId]: (prev[contactId] || 0) + newCount,
          }));
        }
      }
    };

    socket.on('message:new',      onNew);
    socket.on('messages:pending', onPending);

    return () => {
      socket.off('message:new',      onNew);
      socket.off('messages:pending', onPending);
    };
  }, [socket, connected, user, appendMessage, mergeMessages]);

  // ── Set active room (when user opens a chat) ──────────────────────
  const setActiveRoom = useCallback((roomId, contactId) => {
    activeRoomRef.current    = roomId;
    activeContactRef.current = contactId;
    // Clear unread badge for this contact
    if (contactId) {
      setUnread(prev => { const n = {...prev}; delete n[contactId]; return n; });
    }
  }, []);

  const clearActiveRoom = useCallback(() => {
    activeRoomRef.current    = null;
    activeContactRef.current = null;
  }, []);

  // ── Get messages for a room ───────────────────────────────────────
  const getMessages = useCallback((roomId) => {
    return msgMap[roomId] || [];
  }, [msgMap]);

  return (
    <Ctx.Provider value={{
      getMessages,
      loadHistory,
      unread,
      setActiveRoom,
      clearActiveRoom,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useChatStore = () => useContext(Ctx);
