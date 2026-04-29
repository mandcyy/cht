import { useState, useRef } from 'react';
import Avatar from '../../components/ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { fileToBase64 } from '../../utils/format';

function SettingRow({ icon, label, sub, danger=false, onClick }) {
  return (
    <button onClick={onClick}
      style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',width:'100%',background:'none',border:'none',cursor:'pointer',textAlign:'left',transition:'background .1s',WebkitTapHighlightColor:'transparent'}}
      onTouchStart={e=>e.currentTarget.style.background='var(--bg3)'}
      onTouchEnd={e=>e.currentTarget.style.background='none'}
      onMouseOver={e=>e.currentTarget.style.background='var(--bg3)'}
      onMouseOut={e=>e.currentTarget.style.background='none'}>
      <div style={{width:40,height:40,borderRadius:12,background: danger?'rgba(239,68,68,.1)':'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
        {icon}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontWeight:600,fontSize:14,color:danger?'#f87171':'var(--text1)'}}>{label}</p>
        {sub && <p style={{fontSize:12,color:'var(--text3)',marginTop:1}}>{sub}</p>}
      </div>
      {!danger && <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>}
    </button>
  );
}

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState(user?.displayName||'');
  const [bio,      setBio]      = useState(user?.bio||'');
  const [preview,  setPreview]  = useState(user?.avatar?.photo||null);
  const [photoB64, setPhotoB64] = useState(null);
  const [busy,     setBusy]     = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [err,      setErr]      = useState('');
  const fileRef = useRef(null);

  const pickPhoto = async e => {
    const f=e.target.files?.[0]; if(!f) return;
    if(f.size>3*1024*1024){setErr('Max 3MB');return;}
    if(!f.type.startsWith('image/')){setErr('Hanya file gambar');return;}
    setErr('');
    const b64=await fileToBase64(f);
    setPreview(b64); setPhotoB64(b64); e.target.value='';
  };

  const save = async () => {
    if(!photoB64 && name===user?.displayName && bio===user?.bio){setEditing(false);return;}
    setBusy(true); setErr(''); setSaved(false);
    try {
      const body={};
      if(photoB64) body.photoData=photoB64;
      if(name!==user?.displayName) body.displayName=name;
      const r=await api.put('/api/profile/avatar',body);
      updateUser({avatar:r.data.user.avatar,displayName:r.data.user.displayName,bio});
      setSaved(true); setPhotoB64(null);
      setTimeout(()=>{setSaved(false);setEditing(false);},1000);
    } catch(e){setErr(e.response?.data?.error||'Gagal menyimpan');}
    finally{setBusy(false);}
  };

  const cancelEdit = () => {
    setEditing(false); setErr(''); setSaved(false);
    setName(user?.displayName||''); setBio(user?.bio||'');
    setPreview(user?.avatar?.photo||null); setPhotoB64(null);
  };

  const previewUser = {...user, avatar:{...user?.avatar, photo:preview}};

  const settings = [
    {icon:'⭐',label:'Pesan Berbintang',  sub:'Segera hadir'},
    {icon:'🔔',label:'Notifikasi',         sub:'Semua aktif'},
    {icon:'🔒',label:'Privasi & Keamanan', sub:'Kontak saja'},
    {icon:'💾',label:'Penyimpanan',         sub:'Data lokal, tanpa cloud'},
    {icon:'ℹ️',label:'Tentang ChatApp',     sub:'v8.0 · Build 2025'},
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflowY:'auto',WebkitOverflowScrolling:'touch'}}>

      {/* Header */}
      <div style={{padding:'18px 20px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <h1 style={{fontSize:28,fontWeight:800,letterSpacing:'-.5px',color:'var(--text1)'}}>Profil</h1>
        <button onClick={editing?cancelEdit:()=>setEditing(true)}
          style={{background: editing?'var(--bg3)':'rgba(124,110,245,.15)', border:`1px solid ${editing?'var(--border)':'rgba(124,110,245,.3)'}`,color:editing?'var(--text3)':'var(--accent2)',borderRadius:12,padding:'8px 16px',fontSize:13,fontWeight:600,cursor:'pointer'}}>
          {editing?'Batal':'Edit Profil'}
        </button>
      </div>

      {/* Profile card */}
      <div style={{padding:'0 20px 20px',flexShrink:0}}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:22,overflow:'hidden'}}>
          {/* Cover gradient */}
          <div style={{height:80,background:'linear-gradient(135deg,#2a1f6e,#1a1a3e)',position:'relative'}}>
            <div style={{position:'absolute',bottom:-30,left:20}}>
              <div style={{position:'relative',display:'inline-block'}}>
                <Avatar user={previewUser} size={72} ring={editing}/>
                {editing && (
                  <button onClick={()=>fileRef.current?.click()}
                    style={{position:'absolute',bottom:0,right:0,width:26,height:26,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),#9b59f5)',border:'2.5px solid var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </button>
                )}
              </div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={pickPhoto}/>

          <div style={{padding:'38px 20px 20px'}}>
            {editing ? (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:.7,display:'block',marginBottom:8}}>Nama Tampilan</label>
                  <input className="field" value={name} onChange={e=>setName(e.target.value)} placeholder="Nama kamu"/>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:.7,display:'block',marginBottom:8}}>Bio</label>
                  <textarea className="field" value={bio} onChange={e=>setBio(e.target.value)}
                    placeholder="Ceritakan tentang dirimu..."
                    style={{minHeight:70,resize:'none',WebkitUserSelect:'text',userSelect:'text'}}/>
                </div>
                <div style={{background:'var(--bg3)',borderRadius:12,padding:'10px 14px'}}>
                  <p style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:.7,marginBottom:4}}>Username</p>
                  <p style={{fontSize:14,color:'var(--text2)'}}>@{user?.username}</p>
                </div>
                {err   && <p style={{fontSize:13,color:'#fca5a5'}}>{err}</p>}
                {saved && <p style={{fontSize:13,color:'#6ee7b7'}}>✅ Tersimpan!</p>}
                <button onClick={save} disabled={busy} className="btn" style={{width:'100%',padding:13}}>
                  {busy?'Menyimpan...':'Simpan Perubahan'}
                </button>
              </div>
            ) : (
              <>
                <h2 style={{fontSize:22,fontWeight:800,color:'var(--text1)',marginBottom:4}}>{user?.displayName}</h2>
                <p style={{fontSize:14,color:'var(--text3)',marginBottom: user?.bio?10:0}}>@{user?.username}</p>
                {user?.bio && <p style={{fontSize:14,color:'var(--text2)',lineHeight:1.6}}>{user.bio}</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Settings */}
      {!editing && (
        <div style={{padding:'0 20px',flex:1}}>
          <p style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Pengaturan</p>
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden',marginBottom:16}}>
            {settings.map((s,i)=>(
              <div key={i} style={{borderBottom:i<settings.length-1?`1px solid var(--border)`:'none'}}>
                <SettingRow {...s} onClick={()=>{}}/>
              </div>
            ))}
          </div>

          {/* Logout */}
          <div style={{background:'var(--bg2)',border:'1px solid rgba(239,68,68,.2)',borderRadius:20,overflow:'hidden',marginBottom:32}}>
            <SettingRow icon="🚪" label="Keluar" sub="Sesi akan berakhir" danger onClick={logout}/>
          </div>
        </div>
      )}
    </div>
  );
}
