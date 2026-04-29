import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket }    from '../contexts/SocketContext';
import { useAuth }      from '../contexts/AuthContext';
import { useChatStore } from '../contexts/ChatStoreContext';

const TYPING_MS = 1500;

export function useChat(targetUserId) {
  const { socket, connected } = useSocket();
  const { user }              = useAuth();
  const { getMessages, loadHistory, setActiveRoom, clearActiveRoom } = useChatStore();

  const [roomId,      setRoomId]      = useState(null);
  const [status,      setStatus]      = useState('idle');
  const [joinErr,     setJoinErr]     = useState('');
  const [typing,      setTyping]      = useState({});
  const [otherReadAt, setOtherReadAt] = useState(null);

  const roomRef   = useRef(null);
  const socketRef = useRef(null);
  const typingRef = useRef(false);
  const timerRef  = useRef(null);

  useEffect(() => { socketRef.current = socket; }, [socket]);

  // ── Join room ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !connected || !targetUserId) {
      setStatus('idle');
      clearActiveRoom();
      return;
    }

    let cancelled = false;
    setTyping({});
    setJoinErr('');
    setOtherReadAt(null);
    roomRef.current = null;
    setRoomId(null);
    setStatus('joining');

    socket.emit('room:join', { targetUserId }, (ack) => {
      if (cancelled) return;

      if (!ack?.ok) {
        setStatus('error');
        setJoinErr(ack?.error || 'Gagal bergabung');
        return;
      }

      const rid = ack.roomId;
      roomRef.current = rid;
      setRoomId(rid);
      setOtherReadAt(ack.otherReadAt || null);
      setStatus('ready');

      // Load message history from server into global store
      // (handles case where client store is empty, e.g. page refresh)
      if (ack.history?.length) {
        loadHistory(rid, ack.history);
      }

      // Mark room as active → clear unread badge
      setActiveRoom(rid, targetUserId);

      // Tell server we've read up to now
      socket.emit('message:read', { roomId: rid });
    });

    return () => {
      cancelled = true;
      clearActiveRoom();
    };
  }, [socket, connected, targetUserId]);

  // ── Read receipts ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onRead = ({ roomId, readerId, readAt }) => {
      if (roomId !== roomRef.current || readerId === user?.id) return;
      setOtherReadAt(readAt);
    };
    socket.on('message:read', onRead);
    return () => socket.off('message:read', onRead);
  }, [socket, user?.id]);

  // ── Typing ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !user) return;
    const onOn  = ({ userId, name, roomId: rid }) => {
      if (rid !== roomRef.current || userId === user.id) return;
      setTyping(p => ({ ...p, [userId]: name }));
    };
    const onOff = ({ userId, roomId: rid }) => {
      if (rid !== roomRef.current) return;
      setTyping(p => { const n = {...p}; delete n[userId]; return n; });
    };
    socket.on('typing:on',  onOn);
    socket.on('typing:off', onOff);
    return () => {
      socket.off('typing:on',  onOn);
      socket.off('typing:off', onOff);
    };
  }, [socket, user]);

  // ── Stop typing (stable ref) ───────────────────────────────────────
  const stopTyping = useCallback(() => {
    clearTimeout(timerRef.current);
    if (typingRef.current && socketRef.current && roomRef.current) {
      typingRef.current = false;
      socketRef.current.emit('typing:off', { roomId: roomRef.current });
    }
  }, []);

  // ── Notify typing ──────────────────────────────────────────────────
  const notifyTyping = useCallback(() => {
    if (!socketRef.current || !roomRef.current) return;
    if (!typingRef.current) {
      typingRef.current = true;
      socketRef.current.emit('typing:on', { roomId: roomRef.current });
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(stopTyping, TYPING_MS);
  }, [stopTyping]);

  // ── Send message ───────────────────────────────────────────────────
  const send = useCallback((content, type = 'text', mediaData = null) => {
    const sock = socketRef.current;
    const room = roomRef.current;
    if (!sock || !room) return Promise.reject(new Error('Belum terhubung ke room'));
    stopTyping();
    return new Promise((resolve, reject) => {
      const payload = { roomId: room, content, type };
      if (mediaData) payload.mediaData = mediaData;
      sock.emit('message:send', payload, (ack) => {
        if (ack?.ok) resolve(ack);
        else reject(new Error(ack?.error || 'Gagal mengirim'));
      });
    });
  }, [stopTyping]);

  // Messages from global store — persistent across tab changes
  const messages = roomId ? getMessages(roomId) : [];

  return {
    messages,
    typing,
    otherReadAt,
    joining:  status === 'joining',
    ready:    status === 'ready',
    joinErr,
    send,
    notifyTyping,
  };
}
