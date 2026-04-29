import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

export function useStories() {
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const [groups,  setGroups]  = useState([]); // [{ user, stories, hasUnread }]
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    api.get('/api/stories')
      .then(r => setGroups(r.data.groups))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Real-time: new story from a contact
  useEffect(() => {
    if (!socket || !connected) return;
    const onNew = ({ user: storyUser, story }) => {
      setGroups(prev => {
        const idx = prev.findIndex(g => g.user.id === storyUser.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], stories: [story, ...updated[idx].stories], hasUnread: true };
          return updated;
        }
        return [{ user: storyUser, stories: [story], hasUnread: true }, ...prev];
      });
    };
    socket.on('story:new', onNew);
    return () => socket.off('story:new', onNew);
  }, [socket, connected]);

  const addStory = useCallback(async ({ type, content, mediaData, caption }) => {
    const r = await api.post('/api/stories', { type, content, mediaData, caption });
    setGroups(prev => {
      const idx = prev.findIndex(g => g.user.id === user.id);
      const story = { ...r.data.story, viewed: false };
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], stories: [story, ...updated[idx].stories] };
        return updated;
      }
      return [{ user, stories: [story], hasUnread: false }, ...prev];
    });
    return r.data.story;
  }, [user]);

  const markViewed = useCallback(async (storyId, userId) => {
    await api.post(`/api/stories/${storyId}/view`).catch(() => {});
    setGroups(prev => prev.map(g =>
      g.user.id === userId
        ? { ...g, stories: g.stories.map(s => s.id === storyId ? { ...s, viewed: true } : s), hasUnread: g.stories.some(s => !s.viewed && s.id !== storyId) }
        : g
    ));
  }, []);

  const deleteStory = useCallback(async (storyId) => {
    await api.delete(`/api/stories/${storyId}`);
    setGroups(prev => prev.map(g =>
      g.user.id === user.id
        ? { ...g, stories: g.stories.filter(s => s.id !== storyId) }
        : g
    ).filter(g => g.stories.length > 0));
  }, [user]);

  return { groups, loading, addStory, markViewed, deleteStory, refresh: fetch };
}
