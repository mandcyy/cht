import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username:'', password:'' });
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await login(form.username, form.password); }
    catch(e) { setErr(e.response?.data?.error || 'Login gagal'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      overflowY: 'auto',          /* scrollable jika konten melebihi layar */
      WebkitOverflowScrolling: 'touch',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '32px 20px',
    }}>
      {/* Background glow */}
      <div style={{position:'fixed',top:'5%',left:'10%',width:400,height:400,background:'radial-gradient(circle,rgba(124,110,245,.07) 0%,transparent 70%)',pointerEvents:'none',zIndex:0}}/>

      <div style={{width:'100%',maxWidth:380,position:'relative',zIndex:1,animation:'fadeUp .3s ease-out'}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:32}}>
          <div className="anim-float" style={{width:64,height:64,borderRadius:20,margin:'0 auto 16px',background:'linear-gradient(135deg,#7c6ef5,#9b59f5)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(124,110,245,.4)'}}>
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <h1 style={{fontSize:28,fontWeight:800,color:'var(--text1)',letterSpacing:'-.5px'}}>ChatApp</h1>
          <p style={{color:'var(--text3)',fontSize:14,marginTop:6}}>Selamat datang kembali 👋</p>
        </div>

        {/* Card */}
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:22,padding:'28px 24px'}}>
          {err && (
            <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:12,padding:'11px 14px',fontSize:13,color:'#fca5a5',marginBottom:18}}>
              {err}
            </div>
          )}
          <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:.7,display:'block',marginBottom:8}}>Username</label>
              <input className="field" type="text" placeholder="Masukkan username" autoFocus required
                value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:.7,display:'block',marginBottom:8}}>Password</label>
              <input className="field" type="password" placeholder="••••••••" required
                value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
            </div>
            <button type="submit" disabled={busy} className="btn" style={{width:'100%',marginTop:6,padding:14}}>
              {busy ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p style={{textAlign:'center',fontSize:14,color:'var(--text3)',marginTop:22}}>
          Belum punya akun?{' '}
          <Link to="/register" style={{color:'var(--accent2)',fontWeight:600,textDecoration:'none'}}>Daftar</Link>
        </p>
      </div>
    </div>
  );
}
