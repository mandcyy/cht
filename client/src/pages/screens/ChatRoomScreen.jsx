import { useEffect, useRef, useState, useCallback } from 'react';
import Avatar from '../../components/ui/Avatar';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';
import { fmtTime, fmtDate, fileToBase64, getMediaType } from '../../utils/format';

// ── Emoji data ─────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = [
  {
    label: '😊 Ekspresi', emojis: [
      '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇',
      '🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛',
      '😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨',
      '😐','😑','😶','😏','😒','🙄','😬','🤥','😔','😪',
      '🤤','😴','😷','🤒','🤕','🤢','🤧','🥵','🥶','🥴',
      '😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟',
      '🙁','😮','😯','😲','😳','🥺','😦','😧','😨','😰',
      '😥','😢','😭','😱','😖','😣','😞','😓','😩','😫',
      '🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩',
      '🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹',
    ]
  },
  {
    label: '👋 Gesture', emojis: [
      '👍','👎','👊','✊','🤛','🤜','🤞','✌️','🤟','🤘',
      '👌','🤌','🤏','👈','👉','👆','👇','☝️','👋','🤚',
      '🖐️','✋','🖖','👏','🙌','🤲','🙏','✍️','💅','🤳',
      '💪','🦾','🖕','👂','🦻','👃','🧠','🦷','🦴','👀',
      '👁️','👅','👄','💋','🫀','🫁','🦶','🦵','🦿','🦼',
    ]
  },
  {
    label: '❤️ Hati', emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
      '❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟',
      '♥️','💌','💋','😻','💑','👫','👬','👭','💏','🫶',
    ]
  },
  {
    label: '🎉 Perayaan', emojis: [
      '🎉','🎊','🎈','🎁','🎀','🎗️','🎟️','🎫','🏆','🥇',
      '🥈','🥉','🏅','🎖️','🎪','🎭','🎨','🎬','🎤','🎧',
      '🎼','🎵','🎶','🎸','🎹','🎺','🎻','🥁','🪘','🎷',
      '🪗','🎮','🕹️','🎲','🎯','🎳','🎰','🧩','🪆','🪅',
    ]
  },
  {
    label: '🐶 Hewan', emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
      '🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧',
      '🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄',
      '🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪲','🦗','🕷️',
    ]
  },
  {
    label: '🍕 Makanan', emojis: [
      '🍕','🍔','🌮','🌯','🥗','🍜','🍝','🍛','🍣','🍱',
      '🍦','🍰','🎂','🧁','🍩','🍪','🍫','🍬','🍭','🧃',
      '🥤','☕','🧋','🍵','🍺','🍻','🥂','🍷','🥃','🍸',
      '🍓','🍇','🍊','🍋','🍌','🍍','🥭','🍎','🍐','🍑',
    ]
  },
  {
    label: '🌍 Tempat', emojis: [
      '🌍','🌎','🌏','🗺️','🧭','🏔️','⛰️','🌋','🗻','🏕️',
      '🏖️','🏜️','🏝️','🏞️','🏟️','🏛️','🏗️','🧱','🏘️','🏚️',
      '🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪',
      '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐',
    ]
  },
  {
    label: '💡 Simbol', emojis: [
      '✅','❌','⭕','🔴','🟠','🟡','🟢','🔵','🟣','⚫',
      '⚪','🟤','🔶','🔷','🔸','🔹','🔺','🔻','💠','🔘',
      '🔲','🔳','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧',
      '💯','🔥','⚡','🌈','🌊','💫','⭐','🌟','✨','💥',
      '❓','❗','💬','💭','🗨️','🗯️','📢','📣','🔔','🔕',
    ]
  },
];

// ── Emoji Picker ───────────────────────────────────────────────────────
function EmojiPicker({ onSelect, onClose }) {
  const [cat, setCat] = useState(0);

  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0, right: 0,
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: '16px 16px 0 0',
      boxShadow: '0 -8px 32px rgba(0,0,0,.4)',
      zIndex: 50,
      display: 'flex', flexDirection: 'column',
      maxHeight: 300,
      animation: 'slideUp .2s cubic-bezier(.2,.8,.3,1)',
    }}>
      {/* Category tabs */}
      <div style={{
        display: 'flex', overflowX: 'auto', gap: 2,
        padding: '10px 10px 6px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {EMOJI_CATEGORIES.map((c, i) => (
          <button
            key={i}
            onClick={() => setCat(i)}
            style={{
              flexShrink: 0,
              padding: '6px 10px',
              borderRadius: 10,
              fontSize: 13,
              background: cat === i ? 'rgba(124,110,245,.2)' : 'transparent',
              border: cat === i ? '1px solid rgba(124,110,245,.35)' : '1px solid transparent',
              color: cat === i ? 'var(--accent2)' : 'var(--text3)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all .12s',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '8px 6px 12px',
        display: 'flex', flexWrap: 'wrap', gap: 2,
        WebkitOverflowScrolling: 'touch',
      }}>
        {EMOJI_CATEGORIES[cat].emojis.map((em, i) => (
          <button
            key={i}
            onClick={() => onSelect(em)}
            style={{
              width: 40, height: 40, fontSize: 22,
              borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .1s',
              flexShrink: 0,
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseOut={e  => e.currentTarget.style.background = 'transparent'}
            onTouchStart={e => e.currentTarget.style.background = 'var(--bg3)'}
            onTouchEnd={e   => e.currentTarget.style.background = 'transparent'}
          >
            {em}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Double tick ────────────────────────────────────────────────────────
function Ticks({ read }) {
  const c = read ? '#818cf8' : 'rgba(255,255,255,.4)';
  return (
    <svg width="16" height="10" viewBox="0 0 16 10"
      style={{ display:'inline', verticalAlign:'middle', marginLeft:3, flexShrink:0 }}>
      <path d="M1 5l3 3 5-6" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 5l3 3 5-6" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────
function Bubble({ msg, prevMsg, otherReadAt }) {
  const { user }  = useAuth();
  const mine      = msg.senderId === user.id;
  const grouped   = prevMsg?.senderId === msg.senderId;
  const isRead    = mine && otherReadAt && new Date(otherReadAt) >= new Date(msg.timestamp);
  const [lb, setLb] = useState(false);

  return (
    <>
    <div style={{
      display: 'flex', flexDirection: mine ? 'row-reverse' : 'row',
      alignItems: 'flex-end', gap: 8,
      marginTop: grouped ? 2 : 14,
      paddingLeft:  mine ? 48 : 0,
      paddingRight: mine ? 0  : 48,
      animation: 'fadeUp .18s ease-out',
    }}>
      <div style={{ width:32, flexShrink:0, alignSelf:'flex-end' }}>
        {!mine && !grouped && <Avatar user={{ avatar: msg.senderAvatar }} size={30}/>}
      </div>

      <div style={{ maxWidth:'80%' }}>
        {!mine && !grouped && (
          <p style={{ fontSize:11, fontWeight:700, color:'var(--accent2)', marginBottom:3, paddingLeft:4 }}>
            {msg.senderName}
          </p>
        )}

        <div style={{
          background:   mine ? 'linear-gradient(145deg,#6b5de8,#8b4dcf)' : 'var(--bg3)',
          color:        mine ? 'white' : 'var(--text1)',
          borderRadius: mine ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          border:       mine ? 'none' : '1px solid var(--border)',
          boxShadow:    mine ? '0 2px 12px rgba(107,93,232,.25)' : '0 1px 3px rgba(0,0,0,.2)',
          overflow: 'hidden',
        }}>
          {msg.type === 'text' && (
            <p style={{ padding:'10px 14px', fontSize:15, lineHeight:1.5, wordBreak:'break-word', whiteSpace:'pre-wrap' }}>
              {msg.content}
            </p>
          )}
          {msg.type === 'image' && (
            <div>
              <img src={msg.mediaData} onClick={() => setLb(true)}
                style={{ maxWidth:240, maxHeight:240, objectFit:'cover', display:'block', cursor:'zoom-in' }}/>
              {msg.content && msg.content !== '[image]' && (
                <p style={{ padding:'7px 13px', fontSize:13, opacity:.85 }}>{msg.content}</p>
              )}
            </div>
          )}
          {msg.type === 'video' && (
            <div style={{ padding:6 }}>
              <video src={msg.mediaData} controls preload="metadata"
                style={{ maxWidth:240, maxHeight:200, borderRadius:12, display:'block' }}/>
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:3, padding:'0 12px 8px' }}>
            <span style={{ fontSize:10, opacity:.5, color: mine ? 'white' : 'var(--text3)' }}>
              {fmtTime(msg.timestamp)}
            </span>
            {mine && <Ticks read={isRead}/>}
          </div>
        </div>
      </div>
    </div>

    {lb && (
      <div onClick={() => setLb(false)} style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,.95)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} className="anim-fadein">
        <img src={msg.mediaData} style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:12 }}/>
        <button onClick={() => setLb(false)} style={{ position:'absolute', top:20, right:20, background:'rgba(255,255,255,.12)', border:'none', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', color:'white', cursor:'pointer' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    )}
    </>
  );
}

// ── Main ChatRoom ──────────────────────────────────────────────────────
export default function ChatRoomScreen({ contact, onBack }) {
  const { messages, typing, otherReadAt, joining, ready, joinErr, send, notifyTyping } = useChat(contact.id);
  const [text, setText]      = useState('');
  const [busy, setBusy]      = useState(false);
  const [file, setFile]      = useState(null);
  const [prev, setPrev]      = useState(null);
  const [err,  setErr]       = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const bottomRef = useRef(null);
  const taRef     = useRef(null);
  const fileRef   = useRef(null);

  // ── Auto scroll ────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, Object.keys(typing).length]);

  // ── Keep focus on textarea always ──────────────────────────────────
  // Fix bug: focus hilang setelah send, harus klik lagi
  useEffect(() => {
    if (!ready) return;
    // Small delay to let React finish rendering first
    const t = setTimeout(() => {
      taRef.current?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(t);
  }, [ready]);

  // ── Pick file ──────────────────────────────────────────────────────
  const pickFile = async e => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 10*1024*1024) { setErr('Max 10MB'); return; }
    const mt = getMediaType(f);
    if (!mt) { setErr('Hanya gambar & video'); return; }
    setErr(''); setFile(f); setPrev(await fileToBase64(f)); e.target.value='';
    // Refocus textarea after picking file
    setTimeout(() => taRef.current?.focus({ preventScroll: true }), 100);
  };

  // ── Send ───────────────────────────────────────────────────────────
  const doSend = useCallback(async () => {
    if (busy || !ready) return;
    const t = text.trim();
    if (!t && !file) return;

    setBusy(true); setErr(''); setShowEmoji(false);
    try {
      if (file) {
        await send(t || `[${getMediaType(file)}]`, getMediaType(file), prev);
        setFile(null); setPrev(null);
      } else {
        await send(t, 'text');
      }
      setText('');
      // Reset textarea height
      if (taRef.current) taRef.current.style.height = 'auto';
    } catch(e) {
      setErr(e.message || 'Gagal kirim');
    } finally {
      setBusy(false);
      // ✅ Fix: re-focus after send — use requestAnimationFrame for reliability
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          taRef.current?.focus({ preventScroll: true });
        });
      });
    }
  }, [busy, ready, text, file, prev, send]);

  // ── Emoji select ───────────────────────────────────────────────────
  const onEmojiSelect = useCallback((emoji) => {
    const ta = taRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const newText = text.slice(0, start) + emoji + text.slice(end);
      setText(newText);
      // Move cursor after emoji
      requestAnimationFrame(() => {
        ta.focus({ preventScroll: true });
        ta.setSelectionRange(start + emoji.length, start + emoji.length);
        // Auto-grow
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
      });
    } else {
      setText(t => t + emoji);
    }
  }, [text]);

  const onKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    if (e.key === 'Escape') setShowEmoji(false);
  }, [doSend]);

  const onTaChange = useCallback((e) => {
    setText(e.target.value);
    notifyTyping?.();
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, [notifyTyping]);

  const canSend = ready && !busy && (text.trim().length > 0 || !!file);
  const typingNames = Object.values(typing);

  return (
    <div
      style={{ display:'flex', flexDirection:'column', height:'100dvh', background:'var(--bg)', overflow:'hidden' }}
      className="anim-slideIn"
      // Close emoji picker when tapping outside input area
      onClick={(e) => {
        if (showEmoji && !e.target.closest('[data-emoji-zone]')) {
          setShowEmoji(false);
        }
      }}
    >

      {/* ── Header ── */}
      <div style={{
        display:'flex', alignItems:'center', gap:12,
        padding:`10px 14px`,
        paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
        background:'var(--bg2)', borderBottom:'1px solid var(--border)',
        flexShrink:0,
      }}>
        <button className="btn-ghost" onClick={onBack} style={{ padding:'8px 4px', marginLeft:-4, flexShrink:0 }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <Avatar user={contact} size={40} showOnline/>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontWeight:700, fontSize:15, color:'var(--text1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {contact.displayName}
          </p>
          <p style={{ fontSize:12, marginTop:1, color: typingNames.length>0 ? 'var(--accent2)' : contact.online ? 'var(--green)' : 'var(--text3)' }}>
            {typingNames.length > 0 ? 'mengetik...' : contact.online ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex:1, overflowY:'auto',
        padding:'12px 14px 8px',
        backgroundImage:'radial-gradient(ellipse 80% 60% at 80% 10%,rgba(124,110,245,.05) 0%,transparent 100%)',
        WebkitOverflowScrolling:'touch',
      }}>
        {joining && (
          <div style={{ display:'flex', justifyContent:'center', padding:24 }}>
            <div style={{ display:'flex', gap:6 }}>
              {[0,1,2].map(i => (
                <span key={i} className="anim-blink"
                  style={{ width:8, height:8, borderRadius:'50%', background:'rgba(124,110,245,.5)', display:'block', animationDelay:`${i*.18}s` }}/>
              ))}
            </div>
          </div>
        )}

        {joinErr && <p style={{ textAlign:'center', color:'#fca5a5', fontSize:13, padding:20 }}>{joinErr}</p>}

        {!joining && !joinErr && messages.length === 0 && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'65%', textAlign:'center', padding:24 }}>
            <div className="anim-float" style={{ fontSize:56, marginBottom:14 }}>👋</div>
            <p style={{ fontWeight:700, fontSize:17, color:'var(--text2)', marginBottom:8 }}>Mulai chat!</p>
            <p style={{ fontSize:13, color:'var(--text3)' }}>Katakan halo ke {contact.displayName}</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const p = messages[i-1];
          const showDate = !p || new Date(msg.timestamp).toDateString() !== new Date(p.timestamp).toDateString();
          return (
            <div key={msg.id}>
              {showDate && (
                <div style={{ display:'flex', alignItems:'center', gap:10, margin:'14px 0 6px' }}>
                  <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                  <span style={{ fontSize:10, color:'var(--text3)', fontWeight:600, padding:'3px 10px', background:'var(--bg2)', borderRadius:20, border:'1px solid var(--border)', whiteSpace:'nowrap' }}>
                    {fmtDate(msg.timestamp)}
                  </span>
                  <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                </div>
              )}
              <Bubble msg={msg} prevMsg={p} otherReadAt={otherReadAt}/>
            </div>
          );
        })}

        {typingNames.length > 0 && (
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, marginTop:12 }} className="anim-fadein">
            <div style={{ width:32, flexShrink:0 }}/>
            <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'4px 18px 18px 18px', padding:'10px 14px', display:'flex', gap:5 }}>
              {[0,1,2].map(i => (
                <span key={i} className="anim-blink"
                  style={{ width:5, height:5, borderRadius:'50%', background:'var(--text3)', display:'block', animationDelay:`${i*.2}s` }}/>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} style={{ height:4 }}/>
      </div>

      {/* ── Input bar ── */}
      <div
        data-emoji-zone="true"
        style={{
          background:'var(--bg2)', borderTop:'1px solid var(--border)',
          paddingBottom:'max(10px, env(safe-area-inset-bottom, 10px))',
          flexShrink:0, position:'relative',
        }}
      >
        {/* Emoji picker */}
        {showEmoji && (
          <EmojiPicker
            onSelect={onEmojiSelect}
            onClose={() => setShowEmoji(false)}
          />
        )}

        {err && <p style={{ padding:'6px 16px 0', fontSize:12, color:'#fca5a5' }}>{err}</p>}

        {/* Media preview */}
        {file && (
          <div style={{ padding:'10px 14px 0' }}>
            <div style={{ position:'relative', display:'inline-block' }}>
              {file.type.startsWith('image/')
                ? <img src={prev} style={{ height:72, width:72, objectFit:'cover', borderRadius:12, border:'2px solid rgba(124,110,245,.4)', display:'block' }}/>
                : <div style={{ background:'rgba(124,110,245,.1)', border:'1px solid rgba(124,110,245,.3)', borderRadius:12, padding:'9px 14px', fontSize:12, color:'var(--accent2)', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.name}</div>
              }
              <button onClick={() => { setFile(null); setPrev(null); }}
                style={{ position:'absolute', top:-7, right:-7, width:20, height:20, background:'var(--red)', border:'none', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white', fontSize:11, fontWeight:700 }}>
                ✕
              </button>
            </div>
          </div>
        )}

        <div style={{ display:'flex', alignItems:'flex-end', gap:8, padding:'10px 12px 6px' }}>
          {/* Emoji button */}
          <button
            data-emoji-zone="true"
            onClick={() => {
              setShowEmoji(v => !v);
              // Keep focus on textarea
              requestAnimationFrame(() => taRef.current?.focus({ preventScroll: true }));
            }}
            style={{
              flexShrink:0, padding:10, borderRadius:12,
              color: showEmoji ? 'var(--accent2)' : 'var(--text3)',
              background: showEmoji ? 'rgba(124,110,245,.1)' : 'transparent',
              border: showEmoji ? '1px solid rgba(124,110,245,.25)' : '1px solid transparent',
              transition:'all .15s', fontSize:20, lineHeight:1,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
            title="Emoji"
          >
            😊
          </button>

          {/* Attach */}
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}
            style={{ flexShrink:0, padding:10, borderRadius:12, opacity:!ready?.5:1 }}
            title="Lampirkan media">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display:'none' }} onChange={pickFile}/>

          {/* Textarea */}
          <textarea
            ref={taRef}
            rows={1}
            value={text}
            onChange={onTaChange}
            onKeyDown={onKey}
            disabled={!ready || busy}
            placeholder={joining ? 'Menghubungkan...' : 'Pesan...'}
            autoComplete="off"
            style={{
              flex:1, resize:'none', borderRadius:22,
              background:'var(--bg3)', border:'1px solid var(--border)',
              color:'var(--text1)', padding:'11px 16px',
              fontSize:15, outline:'none',
              transition:'border-color .15s',
              lineHeight:1.5, minHeight:44, maxHeight:120,
              overflowY:'auto', fontFamily:'inherit',
              WebkitUserSelect:'text', userSelect:'text',
              opacity: !ready ? .5 : 1,
            }}
            onFocus={e  => { e.target.style.borderColor='rgba(124,110,245,.5)'; }}
            onBlur={e   => {
              // Only blur if tapping emoji or send button — don't lose focus to page
              e.target.style.borderColor='var(--border)';
            }}
          />

          {/* Send */}
          <button
            onClick={doSend}
            disabled={!canSend}
            style={{
              flexShrink:0, width:44, height:44, borderRadius:'50%',
              background: canSend ? 'linear-gradient(135deg,var(--accent),#9b59f5)' : 'var(--bg3)',
              border:'none', cursor: canSend ? 'pointer' : 'default',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all .15s',
              boxShadow: canSend ? '0 4px 16px rgba(124,110,245,.4)' : 'none',
              transform: canSend ? 'scale(1)' : 'scale(.92)',
            }}
            title="Kirim"
          >
            {busy
              ? <svg width="18" height="18" viewBox="0 0 24 24" className="anim-spin"><circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="3"/><path fill="rgba(255,255,255,.85)" d="M12 2a10 10 0 0110 10h-3a7 7 0 00-7-7V2z"/></svg>
              : <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={canSend?'white':'var(--text3)'} strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
