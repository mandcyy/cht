import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username:'', password:'', displayName:'' });
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await register(form.username, form.password, form.displayName); }
    catch(e) { setErr(e.response?.data?.error || 'Registrasi gagal'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '32px 20px',
    }}>
      <div style={{width:'100%',maxWidth:380,animation:'fadeUp .3s ease-out'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:64,height:64,borderRadius:20,margin:'0 auto 14px',background:'linear-gradient(135deg,#7c6ef5,#9b59f5)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(124,110,245,.4)'}}>
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
          </div>
          <h1 style={{fontSize:26,fontWeight:800,color:'var(--text1)'}}>Buat Akun</h1>
          <p style={{color:'var(--text3)',fontSize:14,marginTop:6}}>Bergabung dengan ChatApp</p>
        </div>

        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:22,padding:'28px 24px'}}>
          {err && (
            <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:12,padding:'11px 14px',fontSize:13,color:'#fca5a5',marginBottom:18}}>
              {err}
            </div>
          )}
          <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
            {[
              {k:'username',    l:'Username',                t:'text',     p:'min. 3 karakter',    r:true},
              {k:'displayName', l:'Nama Tampilan (opsional)', t:'text',     p:'nama yang kelihatan', r:false},
              {k:'password',    l:'Password',                t:'password', p:'min. 6 karakter',    r:true},
            ].map(({k,l,t,p,r})=>(
              <div key={k}>
                <label style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:.7,display:'block',marginBottom:8}}>{l}</label>
                <input className="field" type={t} placeholder={p} required={r}
                  value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
              </div>
            ))}
            <button type="submit" disabled={busy} className="btn" style={{width:'100%',marginTop:6,padding:14}}>
              {busy ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>
        </div>

        <p style={{textAlign:'center',fontSize:14,color:'var(--text3)',marginTop:22,paddingBottom:8}}>
          Sudah punya akun?{' '}
          <Link to="/login" style={{color:'var(--accent2)',fontWeight:600,textDecoration:'none'}}>Masuk</Link>
        </p>
      </div>
    </div>
  );
}
