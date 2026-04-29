import { useState, useCallback } from 'react';
import { useAuth }       from '../contexts/AuthContext';
import { useContacts }   from '../hooks/useContacts';
import { useStories }    from '../hooks/useStories';
import ChatListScreen    from './screens/ChatListScreen';
import ChatRoomScreen    from './screens/ChatRoomScreen';
import StoriesScreen     from './screens/StoriesScreen';
import ProfileScreen     from './screens/ProfileScreen';
import BottomNav         from '../components/ui/BottomNav';

export default function MainApp() {
  const { user }  = useAuth();
  const [tab,        setTab]        = useState('chats');
  const [activeChat, setActiveChat] = useState(null);

  const { contacts, requests, loading, sendRequest, acceptRequest, rejectRequest } = useContacts();
  const { groups, addStory, markViewed, deleteStory } = useStories();

  const openChat  = useCallback((c) => setActiveChat(c), []);
  const closeChat = useCallback(()  => setActiveChat(null), []);

  if (activeChat) {
    const live = contacts.find(c => c.id === activeChat.id) || activeChat;
    return <ChatRoomScreen contact={live} onBack={closeChat}/>;
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100dvh',background:'var(--bg)',overflow:'hidden'}}>
      <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',position:'relative'}}>
        {tab === 'chats' && (
          <ChatListScreen
            contacts={contacts}
            requests={requests}
            loadingContacts={loading}
            myUserId={user?.id}
            onOpenChat={openChat}
            onSendRequest={sendRequest}
            onAccept={acceptRequest}
            onReject={rejectRequest}
          />
        )}
        {tab === 'stories' && (
          <StoriesScreen
            groups={groups}
            onAddStory={addStory}
            onViewed={markViewed}
            onDelete={deleteStory}
          />
        )}
        {tab === 'profile' && <ProfileScreen/>}
      </div>
      <BottomNav active={tab} onChange={setTab}/>
    </div>
  );
}
