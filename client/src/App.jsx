import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }   from './contexts/AuthContext';
import { SocketProvider }          from './contexts/SocketContext';
import { ChatStoreProvider }       from './contexts/ChatStoreContext';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainApp      from './pages/MainApp';

function Loader() {
  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--bg)',gap:20}}>
      <div className="anim-float" style={{width:56,height:56,borderRadius:18,background:'linear-gradient(135deg,#7c6ef5,#9b59f5)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(124,110,245,.4)'}}>
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      </div>
      <div style={{display:'flex',gap:6}}>
        {[0,1,2].map(i => <span key={i} className="anim-blink" style={{width:7,height:7,borderRadius:'50%',background:'rgba(124,110,245,.6)',display:'block',animationDelay:`${i*.18}s`}}/>)}
      </div>
    </div>
  );
}

function Guard({ auth, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader/>;
  if (auth && !user)  return <Navigate to="/login" replace/>;
  if (!auth && user)  return <Navigate to="/" replace/>;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        {/* ChatStoreProvider INSIDE SocketProvider so it can access socket */}
        <ChatStoreProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login"    element={<Guard auth={false}><LoginPage/></Guard>}/>
              <Route path="/register" element={<Guard auth={false}><RegisterPage/></Guard>}/>
              <Route path="/*"        element={<Guard auth={true}><MainApp/></Guard>}/>
            </Routes>
          </BrowserRouter>
        </ChatStoreProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
