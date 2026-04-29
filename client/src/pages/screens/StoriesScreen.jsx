import { useState, useRef } from 'react';
import Avatar from '../../components/ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { fileToBase64 } from '../../utils/format';

function age(ts) {
  const m = Math.floor((Date.now()-new Date(ts))/60000);
  if (m<1)  return 'baru saja';
  if (m<60) return `${m} mnt lalu`;
  const h = Math.floor(m/60);
  if (h<24) return `${h} jam lalu`;
  return '1 hari lalu';
}

const BGTONES = ['#110d2e','#0b1c3a','#0a2416','#2a0a0a','#1a150a','#160a2a'];

// ── Story Viewer ────────────────────────────────────────────────────
function Viewer({ group, onClose, onViewed, onDelete, isOwn }) {
  const [idx, setIdx] = useState(0);
  const story = group.stories[idx];
  if (!story) { onClose(); return null; }

  const next = () => {
    onViewed?.(story.id, group.user.id);
    if (idx < group.stories.length-1) setIdx(i=>i+1); else onClose();
  };
  const prev = () => { if (idx > 0) setIdx(i=>i-1); else onClose(); };

  const bg = story.type==='image' ? '#000' : BGTONES[story.id.charCodeAt(0) % BGTONES.length];

  return (
    <div style={{position:'fixed',inset:0,zIndex:500,background:bg,display:'flex',flexDirection:'column'}} className="anim-fadein">
      {/* Progress bars */}
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10,display:'flex',gap:3,padding:'12px 14px 0'}}>
        {group.stories.map((_,i) => (
          <div key={i} style={{flex:1,height:3,borderRadius:99,background:'rgba(255,255,255,.25)',overflow:'hidden'}}>
            <div style={{height:'100%',background:'white',width:i<=idx?'100%':'0%'}}/>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{position:'absolute',top:20,left:0,right:0,zIndex:10,display:'flex',alignItems:'center',gap:10,padding:'0 14px'}}>
        <Avatar user={group.user} size={40} ring/>
        <div style={{flex:1}}>
          <p style={{fontWeight:700,fontSize:14,color:'white'}}>{group.user.displayName}</p>
          <p style={{fontSize:11,color:'rgba(255,255,255,.55)'}}>{age(story.createdAt)}</p>
        </div>
        {isOwn && (
          <button onClick={()=>onDelete?.(story.id)} style={{background:'rgba(239,68,68,.2)',border:'1px solid rgba(239,68,68,.3)',color:'#fca5a5',borderRadius:8,padding:'5px 10px',fontSize:12,cursor:'pointer',flexShrink:0}}>
            Hapus
          </button>
        )}
        <button onClick={onClose} style={{background:'rgba(255,255,255,.12)',border:'none',borderRadius:'50%',width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',color:'white',cursor:'pointer',flexShrink:0}}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Content */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        {story.type==='image'
          ? <img src={story.mediaData} style={{maxWidth:'100%',maxHeight:'100dvh',objectFit:'contain'}} alt=""/>
          : <p style={{fontSize:28,fontWeight:700,color:'white',lineHeight:1.45,textAlign:'center',padding:'0 36px',textShadow:'0 2px 16px rgba(0,0,0,.6)'}}>{story.content}</p>
        }
      </div>

      {/* Caption */}
      {story.type==='image' && story.caption && (
        <div style={{position:'absolute',bottom:60,left:0,right:0,textAlign:'center',padding:'0 20px'}}>
          <span style={{color:'white',fontSize:15,background:'rgba(0,0,0,.45)',borderRadius:14,padding:'9px 18px'}}>{story.caption}</span>
        </div>
      )}

      {/* Views (own) */}
      {isOwn && (
        <div style={{position:'absolute',bottom:16,left:0,right:0,textAlign:'center'}}>
          <span style={{color:'rgba(255,255,255,.55)',fontSize:12}}>👁 {story.views?.length||0} dilihat</span>
        </div>
      )}

      {/* Tap zones */}
      <div style={{position:'absolute',inset:0,display:'flex',top:80}}>
        <div style={{flex:1,cursor:'pointer'}} onClick={prev}/>
        <div style={{flex:1,cursor:'pointer'}} onClick={next}/>
      </div>
    </div>
  );
}

// ── Add Story Sheet ─────────────────────────────────────────────────
function AddSheet({ onAdd, onClose }) {
  const [tab,  setTab]  = useState('text');
  const [txt,  setTxt]  = useState('');
  const [cap,  setCap]  = useState('');
  const [img,  setImg]  = useState(null);
  const [objUrl,setObjUrl]=useState(null);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  const ref = useRef(null);

  const pickImg = async e => {
    const f=e.target.files?.[0]; if(!f) return;
    if(f.size>5*1024*1024){setErr('Max 5MB');return;}
    setErr('');
    setImg(await fileToBase64(f));
    setObjUrl(URL.createObjectURL(f));
    e.target.value='';
  };

  const post = async () => {
    if(tab==='text'&&!txt.trim()){setErr('Tulis sesuatu dulu');return;}
    if(tab==='image'&&!img){setErr('Pilih gambar dulu');return;}
    setBusy(true); setErr('');
    try { await onAdd({type:tab,content:txt.trim(),mediaData:img,caption:cap.trim()}); onClose(); }
    catch(e){ setErr(e.response?.data?.error||'Gagal posting'); }
    finally{setBusy(false);}
  };

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,.7)',backdropFilter:'blur(10px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} className="anim-slideUp"
        style={{width:'100%',maxWidth:480,background:'var(--bg2)',borderRadius:'24px 24px 0 0',padding:'24px 20px 48px',border:'1px solid var(--border)'}}>
        <div style={{width:40,height:4,borderRadius:99,background:'var(--bg4)',margin:'0 auto 22px'}}/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <h3 style={{fontWeight:700,fontSize:18,color:'var(--text1)'}}>Buat Story</h3>
          <button className="btn-ghost" onClick={onClose}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{display:'flex',gap:8,marginBottom:20,background:'var(--bg3)',borderRadius:14,padding:4}}>
          {['text','image'].map(t => (
            <button key={t} onClick={()=>setTab(t)}
              style={{flex:1,padding:'9px',borderRadius:11,fontSize:13,fontWeight:600,cursor:'pointer',transition:'all .15s',background:tab===t?'var(--bg2)':'transparent',border:tab===t?'1px solid var(--border)':'1px solid transparent',color:tab===t?'var(--text1)':'var(--text3)',boxShadow:tab===t?'0 2px 8px rgba(0,0,0,.3)':'none'}}>
              {t==='text'?'📝 Teks':'🖼 Gambar'}
            </button>
          ))}
        </div>

        {tab==='text' ? (
          <textarea value={txt} onChange={e=>setTxt(e.target.value)}
            placeholder="Apa yang ingin kamu bagikan hari ini?"
            style={{width:'100%',minHeight:120,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:16,padding:'14px 16px',fontSize:16,color:'var(--text1)',outline:'none',resize:'none',fontFamily:'inherit',lineHeight:1.55,WebkitUserSelect:'text',userSelect:'text'}}
          />
        ) : (
          <>
            <div onClick={()=>ref.current?.click()}
              style={{minHeight:160,background:'var(--bg3)',border:`2px dashed ${img?'rgba(124,110,245,.4)':'var(--border)'}`,borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',overflow:'hidden',transition:'border-color .15s',marginBottom:10}}>
              {objUrl
                ? <img src={objUrl} style={{maxWidth:'100%',maxHeight:220,objectFit:'contain',borderRadius:12}}/>
                : <div style={{textAlign:'center',padding:28}}>
                    <div style={{fontSize:42,marginBottom:10}}>📷</div>
                    <p style={{color:'var(--text3)',fontSize:14}}>Tap untuk pilih foto</p>
                    <p style={{color:'var(--text3)',fontSize:11,marginTop:4}}>Max 5MB</p>
                  </div>
              }
            </div>
            <input ref={ref} type="file" accept="image/*" style={{display:'none'}} onChange={pickImg}/>
            <input className="field" value={cap} onChange={e=>setCap(e.target.value)} placeholder="Tambah caption (opsional)"/>
          </>
        )}

        {err && <p style={{color:'#fca5a5',fontSize:13,marginTop:10}}>{err}</p>}

        <button onClick={post} disabled={busy} className="btn" style={{width:'100%',marginTop:18,padding:14,fontSize:15}}>
          {busy ? 'Memposting...' : '🚀 Post Story · hilang 24 jam'}
        </button>
      </div>
    </div>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────
export default function StoriesScreen({ groups, onAddStory, onViewed, onDelete }) {
  const { user } = useAuth();
  const [viewer,  setViewer]  = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const myGroup = groups.find(g=>g.user.id===user?.id);
  const others  = groups.filter(g=>g.user.id!==user?.id);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'18px 20px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <h1 style={{fontSize:28,fontWeight:800,letterSpacing:'-.5px',color:'var(--text1)'}}>Story</h1>
        <button onClick={()=>setShowAdd(true)} className="btn" style={{padding:'9px 18px',fontSize:13,borderRadius:14}}>
          + Buat
        </button>
      </div>

      <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
        {/* My story card */}
        <div style={{padding:'0 20px 18px',flexShrink:0}}>
          <button onClick={()=>myGroup?setViewer({group:myGroup}):setShowAdd(true)}
            style={{display:'flex',alignItems:'center',gap:14,width:'100%',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:20,padding:'15px 16px',cursor:'pointer',textAlign:'left',transition:'background .12s'}}
            onMouseOver={e=>e.currentTarget.style.background='var(--bg3)'}
            onMouseOut={e=>e.currentTarget.style.background='var(--bg2)'}>
            <div style={{position:'relative',flexShrink:0}}>
              <Avatar user={user} size={56} ring={!!myGroup}/>
              <div style={{position:'absolute',bottom:-2,right:-2,width:22,height:22,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),#9b59f5)',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid var(--bg2)',cursor:'pointer'}}
                onClick={e=>{e.stopPropagation();setShowAdd(true);}}>
                <svg width="11" height="11" fill="white" viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>
              </div>
            </div>
            <div>
              <p style={{fontWeight:700,fontSize:15,color:'var(--text1)'}}>{myGroup?'Story Saya':'Tambah Story'}</p>
              <p style={{fontSize:13,color:'var(--text3)',marginTop:3}}>{myGroup?`${myGroup.stories.length} story aktif · ketuk untuk lihat`:'Bagikan momenmu'}</p>
            </div>
          </button>
        </div>

        {/* Contacts stories */}
        {others.length > 0 && (
          <div style={{padding:'0 20px'}}>
            <p style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Kontak ({others.length})</p>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {others.map(g => (
                <button key={g.user.id} onClick={()=>setViewer({group:g})}
                  style={{display:'flex',alignItems:'center',gap:14,padding:'13px 16px',background:'var(--bg2)',border:`1px solid ${g.hasUnread?'rgba(124,110,245,.3)':'var(--border)'}`,borderRadius:18,width:'100%',textAlign:'left',cursor:'pointer',transition:'all .12s'}}
                  onMouseOver={e=>e.currentTarget.style.background='var(--bg3)'}
                  onMouseOut={e=>e.currentTarget.style.background='var(--bg2)'}>
                  {/* Ring */}
                  <div style={{width:58,height:58,borderRadius:'50%',padding:3,background:g.hasUnread?'linear-gradient(135deg,#7c6ef5,#ec4899)':'rgba(255,255,255,.1)',flexShrink:0}}>
                    <div style={{width:'100%',height:'100%',borderRadius:'50%',border:'2px solid var(--bg2)',overflow:'hidden'}}>
                      <Avatar user={g.user} size={48}/>
                    </div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontWeight:600,fontSize:15,color:'var(--text1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.user.displayName}</p>
                    <p style={{fontSize:12,marginTop:3,color:g.hasUnread?'var(--accent2)':'var(--text3)'}}>{g.stories.length} story · {g.hasUnread?'Belum dilihat ✨':'Sudah dilihat'}</p>
                  </div>
                  {g.hasUnread && <div style={{width:10,height:10,borderRadius:'50%',background:'var(--accent)',flexShrink:0}}/>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {others.length===0 && !myGroup && (
          <div style={{textAlign:'center',padding:'48px 32px'}}>
            <div className="anim-float" style={{fontSize:60,marginBottom:18}}>📸</div>
            <p style={{fontWeight:700,fontSize:18,color:'var(--text2)',marginBottom:8}}>Belum ada story</p>
            <p style={{fontSize:14,color:'var(--text3)',lineHeight:1.65}}>Story dari kontak akan muncul di sini. Buat story pertamamu!</p>
            <button className="btn" style={{marginTop:24,padding:'12px 28px'}} onClick={()=>setShowAdd(true)}>Buat Story</button>
          </div>
        )}

        <div style={{height:24}}/>
      </div>

      {viewer  && <Viewer group={viewer.group} onClose={()=>setViewer(null)} onViewed={onViewed} onDelete={onDelete} isOwn={viewer.group.user.id===user?.id}/>}
      {showAdd && <AddSheet onAdd={onAddStory} onClose={()=>setShowAdd(false)}/>}
    </div>
  );
}
