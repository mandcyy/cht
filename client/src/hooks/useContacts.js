import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useSocket } from '../contexts/SocketContext';

export function useContacts() {
  const { socket, connected } = useSocket();
  const [contacts,  setContacts]  = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([api.get('/api/contacts'), api.get('/api/contacts/requests')])
      .then(([c, r]) => { setContacts(c.data.contacts); setRequests(r.data.requests); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket || !connected) return;
    socket.emit('presence:request');

    const onOnline   = (u)  => setContacts(p => p.map(c => c.id===u.id ? {...c, online:true} : c));
    const onOffline  = ({userId,lastSeen}) => setContacts(p => p.map(c => c.id===userId ? {...c,online:false,lastSeen} : c));
    const onSnapshot = (list) => { const ids = new Set(list.map(u=>u.id)); setContacts(p => p.map(c => ({...c,online:ids.has(c.id)}))); };
    const onRequest  = (req)  => setRequests(p => [...p.filter(r=>r.id!==req.requestId), {id:req.requestId, from:req.from, createdAt:req.createdAt}]);
    const onPending  = (list) => setRequests(list);
    const onAccepted = ({contact}) => setContacts(p => p.find(c=>c.id===contact.id) ? p : [...p, contact]);
    // When a contact updates their profile
    const onProfileUpdated = ({userId, avatar, displayName}) =>
      setContacts(p => p.map(c => c.id===userId ? {...c, avatar, displayName} : c));

    socket.on('presence:online',          onOnline);
    socket.on('presence:offline',         onOffline);
    socket.on('presence:snapshot',        onSnapshot);
    socket.on('contact:request',          onRequest);
    socket.on('contact:requests_pending', onPending);
    socket.on('contact:accepted',         onAccepted);
    socket.on('profile:updated',          onProfileUpdated);

    return () => {
      socket.off('presence:online',          onOnline);
      socket.off('presence:offline',         onOffline);
      socket.off('presence:snapshot',        onSnapshot);
      socket.off('contact:request',          onRequest);
      socket.off('contact:requests_pending', onPending);
      socket.off('contact:accepted',         onAccepted);
      socket.off('profile:updated',          onProfileUpdated);
    };
  }, [socket, connected]);

  const sendRequest = useCallback(async (username) => {
    await api.post('/api/contacts/request', { username });
  }, []);

  const acceptRequest = useCallback(async (requestId) => {
    const r = await api.post('/api/contacts/accept', { requestId });
    setRequests(p => p.filter(req => req.id !== requestId));
    setContacts(p => p.find(c => c.id===r.data.contact.id) ? p : [...p, r.data.contact]);
    return r.data.contact;
  }, []);

  const rejectRequest = useCallback(async (requestId) => {
    await api.post('/api/contacts/reject', { requestId });
    setRequests(p => p.filter(req => req.id !== requestId));
  }, []);

  return { contacts, requests, loading, sendRequest, acceptRequest, rejectRequest };
}
