export default function BottomNav({ active, onChange }) {
  const tabs = [
    {
      id: 'chats', label: 'Chat',
      icon: (on) => (
        <svg width="23" height="23" viewBox="0 0 24 24" fill={on ? 'var(--accent)' : 'none'} stroke={on ? 'var(--accent)' : 'var(--text3)'} strokeWidth="1.9">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      ),
    },
    {
      id: 'stories', label: 'Story',
      icon: (on) => (
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={on ? 'var(--accent)' : 'var(--text3)'} strokeWidth="1.9">
          <circle cx="12" cy="12" r="4" fill={on ? 'var(--accent)' : 'none'} strokeWidth="1.9"/>
          <path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
        </svg>
      ),
    },
    {
      id: 'profile', label: 'Profil',
      icon: (on) => (
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={on ? 'var(--accent)' : 'var(--text3)'} strokeWidth="1.9">
          <circle cx="12" cy="8" r="4" fill={on ? 'var(--accent)' : 'none'} strokeWidth="1.9"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      display: 'flex',
      background: 'var(--bg2)',
      borderTop: '1px solid var(--border)',
      paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
      flexShrink: 0,
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 4, padding: '10px 0 4px',
              background: 'none', border: 'none', cursor: 'pointer',
              position: 'relative', transition: 'opacity .1s',
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '.8'}
            onMouseOut={e  => e.currentTarget.style.opacity = '1'}>
            {/* Top pill indicator */}
            <span style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: on ? 28 : 0, height: 3, borderRadius: '0 0 3px 3px',
              background: 'var(--accent)', transition: 'width .2s cubic-bezier(.34,1.56,.64,1)',
            }}/>
            {t.icon(on)}
            <span style={{
              fontSize: 10, fontWeight: on ? 700 : 500,
              color: on ? 'var(--accent)' : 'var(--text3)',
              letterSpacing: .3,
            }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
