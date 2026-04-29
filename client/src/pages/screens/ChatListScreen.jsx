import { useState, useRef, useCallback } from 'react';
import Avatar from '../../components/ui/Avatar';
import { useChatStore } from '../../contexts/ChatStoreContext';
import { fmtLastSeen, fmtTime } from '../../utils/format';

// ── Context Menu (long press) ─────────────────────────────────────────
function ContextMenu({ contact, isPinned, isArchived, onPin, onArchive, onDelete, onClose }) {
  const items = [
    {
      icon: isPinned ? '📌' : '📍',
      label: isPinned ? 'Lepas Pin' : 'Pin Chat',
      color: 'var(--text1)',
      action: onPin,
    },
    {
      icon: isArchived ? '📂' : '🗄️',
      label: isArchived ? 'Keluarkan dari Arsip' : 'Arsipkan Chat',
      color: 'var(--text1)',
      action: onArchive,
    },
    {
      icon: '🗑️',
      label: 'Hapus Chat',
      color: '#f87171',
      action: onDelete,
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="anim-slideUp"
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--bg2)',
          borderRadius: '22px 22px 0 0',
          border: '1px solid var(--border)',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          overflow: 'hidden',
        }}
      >
        {/* Handle + contact info */}
        <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--bg4)', margin: '0 auto 14px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar user={contact} size={44}/>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text1)' }}>{contact.displayName}</p>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>@{contact.username}</p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => { item.action(); onClose(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '15px 20px', width: '100%',
              background: 'none', border: 'none',
              borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer', textAlign: 'left',
              transition: 'background .1s',
            }}
            onTouchStart={e => e.currentTarget.style.background = 'var(--bg3)'}
            onTouchEnd={e   => e.currentTarget.style.background = 'none'}
            onMouseOver={e  => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseOut={e   => e.currentTarget.style.background = 'none'}
          >
            <span style={{ fontSize: 22, width: 32, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontSize: 15, fontWeight: 500, color: item.color }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Delete confirmation ───────────────────────────────────────────────
function DeleteConfirm({ contact, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="anim-fadein"
        style={{
          width: '100%', maxWidth: 320,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '28px 24px', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 14 }}>🗑️</div>
        <p style={{ fontWeight: 700, fontSize: 17, color: 'var(--text1)', marginBottom: 8 }}>
          Hapus Chat?
        </p>
        <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 24 }}>
          Semua pesan dengan <strong style={{ color: 'var(--text2)' }}>{contact.displayName}</strong> akan dihapus dari perangkatmu. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '12px', borderRadius: 14,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: 'var(--text2)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '12px', borderRadius: 14,
              background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)',
              color: '#f87171', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Chat bottom sheet ─────────────────────────────────────────────
function NewChatSheet({ contacts, onStartChat, onSendRequest, onClose }) {
  const [search,   setSearch]   = useState('');
  const [username, setUsername] = useState('');
  const [busy,     setBusy]     = useState(false);
  const [msg,      setMsg]      = useState('');
  const [ok,       setOk]       = useState(false);

  const filtered = contacts.filter(c =>
    c.displayName.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  const sendReq = async e => {
    e.preventDefault();
    if (!username.trim()) return;
    setBusy(true); setMsg(''); setOk(false);
    try {
      await onSendRequest(username.trim());
      setOk(true); setMsg('Permintaan terkirim! Menunggu konfirmasi.'); setUsername('');
    } catch(err) { setMsg(err.response?.data?.error || 'Gagal mengirim permintaan'); }
    finally { setBusy(false); }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="anim-slideUp"
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--bg2)',
          borderRadius: '24px 24px 0 0',
          border: '1px solid var(--border)',
          maxHeight: '85dvh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px 12px', flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--bg4)', margin: '0 auto 18px' }}/>

          {/* Tambah kontak baru */}
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>
            Tambah Kontak Baru
          </p>
          {msg && (
            <div style={{ background: ok?'rgba(37,211,102,.1)':'rgba(239,68,68,.1)', border:`1px solid ${ok?'rgba(37,211,102,.25)':'rgba(239,68,68,.25)'}`, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: ok?'#6ee7b7':'#fca5a5', marginBottom: 10 }}>
              {msg}
            </div>
          )}
          <form onSubmit={sendReq} style={{ display: 'flex', gap: 8 }}>
            <input
              className="field"
              style={{ flex: 1, fontSize: 14, padding: '10px 14px' }}
              placeholder="Cari via @username"
              value={username}
              onChange={e => { setUsername(e.target.value); setOk(false); setMsg(''); }}
            />
            <button type="submit" disabled={busy || !username.trim()} className="btn"
              style={{ padding: '10px 16px', borderRadius: 12, fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {busy ? '...' : '+ Tambah'}
            </button>
          </form>

          <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }}/>

          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>
            Mulai Chat — Kontak ({contacts.length})
          </p>
          {contacts.length > 4 && (
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <svg style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:12, paddingLeft:32, paddingRight:12, paddingTop:9, paddingBottom:9, fontSize:13, color:'var(--text1)', outline:'none' }}
                placeholder="Cari kontak..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 'max(20px, env(safe-area-inset-bottom,20px))' }}>
          {contacts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 20px' }}>
              <p style={{ fontSize:14, color:'var(--text3)' }}>Belum ada kontak.</p>
              <p style={{ fontSize:13, color:'var(--text3)', marginTop:6 }}>Tambah kontak dulu via form di atas.</p>
            </div>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign:'center', fontSize:13, color:'var(--text3)', padding:'20px 0' }}>Tidak ditemukan</p>
          ) : filtered.map(c => (
            <button
              key={c.id}
              onClick={() => { onStartChat(c); onClose(); }}
              style={{ display:'flex', alignItems:'center', gap:14, padding:'11px 20px', width:'100%', background:'none', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer', textAlign:'left', WebkitTapHighlightColor:'transparent', transition:'background .08s' }}
              onTouchStart={e => e.currentTarget.style.background='var(--bg3)'}
              onTouchEnd={e   => e.currentTarget.style.background='none'}
              onMouseOver={e  => e.currentTarget.style.background='var(--bg3)'}
              onMouseOut={e   => e.currentTarget.style.background='none'}
            >
              <Avatar user={c} size={46} showOnline/>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontWeight:600, fontSize:15, color:'var(--text1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.displayName}</p>
                <p style={{ fontSize:12, marginTop:2, color:c.online?'var(--green)':'var(--text3)' }}>{c.online?'● Online':`@${c.username}`}</p>
              </div>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text3)" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Request banner ────────────────────────────────────────────────────
function RequestBanner({ requests, onAccept, onReject }) {
  if (!requests.length) return null;
  return (
    <div style={{ borderBottom:'1px solid var(--border)', background:'rgba(124,110,245,.06)', flexShrink:0 }}>
      <p style={{ padding:'10px 20px 4px', fontSize:11, fontWeight:700, color:'rgba(124,110,245,.75)', textTransform:'uppercase', letterSpacing:.8 }}>
        Permintaan Kontak ({requests.length})
      </p>
      {requests.map(r => (
        <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 20px 12px' }}>
          <Avatar user={r.from} size={44}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontWeight:600, fontSize:14, color:'var(--text1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.from?.displayName}</p>
            <p style={{ fontSize:12, color:'var(--text3)' }}>Ingin berteman denganmu</p>
          </div>
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            <button onClick={()=>onAccept(r.id)} style={{ background:'rgba(37,211,102,.15)', border:'1px solid rgba(37,211,102,.3)', color:'#4ade80', borderRadius:10, padding:'7px 14px', fontSize:12, fontWeight:700, cursor:'pointer' }}>✓ Terima</button>
            <button onClick={()=>onReject(r.id)} style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text3)', borderRadius:10, padding:'7px 10px', fontSize:12, cursor:'pointer' }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Chat item with long press ─────────────────────────────────────────
function ChatItem({ c, isPinned, isArchived, onOpen, onLongPress, preview }) {
  const pressTimer  = useRef(null);
  const didLongPress = useRef(false);

  const startPress = useCallback(() => {
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      // Haptic feedback on mobile
      if (navigator.vibrate) navigator.vibrate(40);
      onLongPress(c);
    }, 500);
  }, [c, onLongPress]);

  const endPress = useCallback((e) => {
    clearTimeout(pressTimer.current);
    if (didLongPress.current) e.preventDefault();
  }, []);

  const handleClick = useCallback(() => {
    if (!didLongPress.current) onOpen(c);
  }, [c, onOpen]);

  return (
    <div
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={() => clearTimeout(pressTimer.current)}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={() => clearTimeout(pressTimer.current)}
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 20px', width: '100%',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background .08s',
        userSelect: 'none',
        background: isPinned ? 'rgba(124,110,245,.05)' : 'none',
      }}
      onMouseOver={e => e.currentTarget.style.background = isPinned ? 'rgba(124,110,245,.1)' : 'var(--bg2)'}
      onMouseOut={e  => e.currentTarget.style.background = isPinned ? 'rgba(124,110,245,.05)' : 'none'}
    >
      {/* Pin indicator */}
      {isPinned && (
        <div style={{ position: 'absolute', left: 6, width: 3, height: 40, borderRadius: 99, background: 'var(--accent)' }}/>
      )}

      <Avatar user={c} size={52} showOnline/>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:3 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, minWidth:0 }}>
            {isPinned && <span style={{ fontSize:12, flexShrink:0 }}>📌</span>}
            {isArchived && <span style={{ fontSize:12, flexShrink:0 }}>🗄️</span>}
            <p style={{ fontWeight: c.unreadCount>0 ? 700 : 600, fontSize:15, color:'var(--text1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {c.displayName}
            </p>
          </div>
          {c.lastMsg && (
            <span style={{ fontSize:11, color: c.unreadCount>0 ? 'var(--accent2)' : 'var(--text3)', flexShrink:0, marginLeft:6 }}>
              {fmtTime(c.lastMsg.timestamp)}
            </span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          <p style={{ fontSize:13, color: c.unreadCount>0 ? 'var(--text2)' : 'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, fontWeight: c.unreadCount>0 ? 600 : 400 }}>
            {c.lastMsg ? preview(c.lastMsg) : <span style={{ color:'var(--text3)' }}>@{c.username}</span>}
          </p>
          {c.unreadCount > 0 && (
            <span style={{ flexShrink:0, minWidth:20, height:20, borderRadius:10, background:'var(--accent)', color:'white', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 6px' }}>
              {c.unreadCount > 99 ? '99+' : c.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────
export default function ChatListScreen({
  contacts, requests, loadingContacts,
  myUserId, onOpenChat, onSendRequest, onAccept, onReject,
}) {
  const { unread, getMessages } = useChatStore();
  const [search,   setSearch]   = useState('');
  const [showNew,  setShowNew]  = useState(false);

  // Long press state
  const [menuContact,   setMenuContact]   = useState(null);
  const [deleteContact, setDeleteContact] = useState(null);

  // Per-contact preferences (in-memory, resets on refresh)
  const [pinned,   setPinned]   = useState(new Set()); // Set<contactId>
  const [archived, setArchived] = useState(new Set()); // Set<contactId>
  const [deleted,  setDeleted]  = useState(new Set()); // Set<contactId>

  const handlePin = useCallback((contactId) => {
    setPinned(prev => {
      const n = new Set(prev);
      n.has(contactId) ? n.delete(contactId) : n.add(contactId);
      return n;
    });
  }, []);

  const handleArchive = useCallback((contactId) => {
    setArchived(prev => {
      const n = new Set(prev);
      n.has(contactId) ? n.delete(contactId) : n.add(contactId);
      return n;
    });
  }, []);

  const handleDelete = useCallback((contactId) => {
    setDeleted(prev => new Set([...prev, contactId]));
  }, []);

  const enriched = contacts
    .map(c => {
      const roomId = [myUserId, c.id].sort().join(':');
      const msgs   = getMessages(roomId);
      const last   = msgs[msgs.length - 1];
      return { ...c, roomId, lastMsg: last, unreadCount: unread[c.id] || 0 };
    })
    .filter(c => (c.lastMsg || c.unreadCount > 0) && !deleted.has(c.id));

  const filtered = enriched.filter(c =>
    (c.displayName.toLowerCase().includes(search.toLowerCase()) ||
     c.username.toLowerCase().includes(search.toLowerCase())) &&
    (!search ? !archived.has(c.id) : true) // hide archived unless searching
  );

  // Sort: pinned first, then by last message time
  const sorted = [...filtered].sort((a, b) => {
    const ap = pinned.has(a.id) ? 1 : 0;
    const bp = pinned.has(b.id) ? 1 : 0;
    if (ap !== bp) return bp - ap;
    const ta = a.lastMsg ? new Date(a.lastMsg.timestamp) : 0;
    const tb = b.lastMsg ? new Date(b.lastMsg.timestamp) : 0;
    return tb - ta;
  });

  const archivedItems = enriched.filter(c => archived.has(c.id));

  const preview = (msg) => {
    if (!msg) return '';
    if (msg.type === 'image') return '📷 Gambar';
    if (msg.type === 'video') return '🎥 Video';
    return msg.content.length > 38 ? msg.content.slice(0, 38) + '…' : msg.content;
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', position:'relative' }}>

      {/* Header */}
      <div style={{ padding:'18px 20px 14px', flexShrink:0 }}>
        <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:'-.5px', color:'var(--text1)', marginBottom:14 }}>Chat</h1>
        <div style={{ position:'relative' }}>
          <svg style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none' }} width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            style={{ width:'100%', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, paddingLeft:38, paddingRight:14, paddingTop:11, paddingBottom:11, fontSize:14, color:'var(--text1)', outline:'none', WebkitUserSelect:'text', userSelect:'text' }}
            placeholder="Cari percakapan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => e.target.style.borderColor='rgba(124,110,245,.5)'}
            onBlur={e  => e.target.style.borderColor='var(--border)'}
          />
        </div>
      </div>

      <RequestBanner requests={requests} onAccept={onAccept} onReject={onReject}/>

      {/* Chat list */}
      <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', position:'relative' }}>
        {loadingContacts ? (
          Array.from({length:4},(_,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 20px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:54, height:54, borderRadius:'50%', background:'var(--bg3)', flexShrink:0 }}/>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:9 }}>
                <div style={{ height:13, width:'45%', borderRadius:8, background:'var(--bg3)' }}/>
                <div style={{ height:11, width:'65%', borderRadius:8, background:'var(--bg3)' }}/>
              </div>
            </div>
          ))
        ) : sorted.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'55%', textAlign:'center', padding:32 }}>
            <div className="anim-float" style={{ fontSize:60, marginBottom:18 }}>💬</div>
            <p style={{ fontWeight:700, fontSize:18, color:'var(--text2)', marginBottom:8 }}>
              {search ? 'Tidak ditemukan' : 'Belum ada percakapan'}
            </p>
            <p style={{ fontSize:14, color:'var(--text3)', maxWidth:240, lineHeight:1.65 }}>
              {search ? 'Coba kata kunci lain' : 'Tekan tombol ✏️ di bawah untuk mulai chat'}
            </p>
          </div>
        ) : (
          <>
            {sorted.map(c => (
              <ChatItem
                key={c.id}
                c={c}
                isPinned={pinned.has(c.id)}
                isArchived={archived.has(c.id)}
                onOpen={onOpenChat}
                onLongPress={setMenuContact}
                preview={preview}
              />
            ))}

            {/* Archived section */}
            {archivedItems.length > 0 && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 20px 8px' }}>
                  <span style={{ fontSize:12 }}>🗄️</span>
                  <p style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:.8 }}>
                    Diarsipkan ({archivedItems.length})
                  </p>
                </div>
                {archivedItems.map(c => (
                  <ChatItem
                    key={c.id}
                    c={c}
                    isPinned={false}
                    isArchived
                    onOpen={onOpenChat}
                    onLongPress={setMenuContact}
                    preview={preview}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowNew(true)}
        style={{
          position:'absolute', bottom:20, right:20,
          width:56, height:56, borderRadius:'50%',
          background:'linear-gradient(135deg,var(--accent),#9b59f5)',
          border:'none', cursor:'pointer', zIndex:10,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 6px 24px rgba(124,110,245,.45)',
          transition:'transform .15s, box-shadow .15s',
        }}
        onMouseOver={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(124,110,245,.6)'; }}
        onMouseOut={e  => { e.currentTarget.style.transform='scale(1)';   e.currentTarget.style.boxShadow='0 6px 24px rgba(124,110,245,.45)'; }}
        onTouchStart={e => e.currentTarget.style.transform='scale(.94)'}
        onTouchEnd={e   => e.currentTarget.style.transform='scale(1)'}
        title="Mulai chat baru"
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
      </button>

      {/* New chat sheet */}
      {showNew && (
        <NewChatSheet
          contacts={contacts}
          onStartChat={onOpenChat}
          onSendRequest={onSendRequest}
          onClose={() => setShowNew(false)}
        />
      )}

      {/* Context menu (long press) */}
      {menuContact && (
        <ContextMenu
          contact={menuContact}
          isPinned={pinned.has(menuContact.id)}
          isArchived={archived.has(menuContact.id)}
          onPin={() => handlePin(menuContact.id)}
          onArchive={() => handleArchive(menuContact.id)}
          onDelete={() => setDeleteContact(menuContact)}
          onClose={() => setMenuContact(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteContact && (
        <DeleteConfirm
          contact={deleteContact}
          onConfirm={() => { handleDelete(deleteContact.id); setDeleteContact(null); setMenuContact(null); }}
          onCancel={() => setDeleteContact(null)}
        />
      )}
    </div>
  );
}
