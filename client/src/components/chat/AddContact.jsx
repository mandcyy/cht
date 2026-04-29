import { useState } from 'react';

export default function AddContact({ onSendRequest, onClose }) {
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  const [sent, setSent] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!username.trim()) return;
    setErr(''); setBusy(true);
    try {
      await onSendRequest(username.trim());
      setSent(true);
      setUsername('');
    } catch(e) {
      setErr(e.response?.data?.error || 'Gagal mengirim permintaan');
    } finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(0,0,0,.55)', backdropFilter:'blur(6px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:420, background:'#16162a', border:'1px solid var(--border)', borderRadius:'20px 20px 0 0', padding:'28px 24px 40px', animation:'fadeUp .25s ease-out' }}>
        <div style={{ width:36, height:4, borderRadius:99, background:'rgba(255,255,255,.12)', margin:'0 auto 22px' }}/>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <h2 style={{ fontWeight:700, fontSize:16, color:'var(--text-primary)' }}>Tambah Kontak</h2>
          <button className="btn-ghost" onClick={onClose} style={{ padding:6 }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16, lineHeight:1.6 }}>
          Masukkan username. Orang tersebut perlu <strong style={{ color:'var(--text-secondary)' }}>menerima permintaan</strong> sebelum bisa chat.
        </p>

        {err  && <div style={{ background:'rgba(239,68,68,.1)',  border:'1px solid rgba(239,68,68,.25)',  borderRadius:10, padding:'10px 14px', fontSize:13, color:'#fca5a5', marginBottom:14 }}>{err}</div>}
        {sent && (
          <div style={{ background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.3)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#c7d2fe', marginBottom:14 }}>
            ✅ Permintaan kontak terkirim! Menunggu konfirmasi...
          </div>
        )}

        <form onSubmit={submit} style={{ display:'flex', gap:10 }}>
          <input className="field" style={{ flex:1 }} placeholder="@username" value={username}
            onChange={e => { setUsername(e.target.value); setSent(false); }} autoFocus/>
          <button type="submit" disabled={busy || !username.trim()} className="btn-accent" style={{ padding:'11px 18px', borderRadius:12, whiteSpace:'nowrap' }}>
            {busy ? '...' : 'Kirim'}
          </button>
        </form>
      </div>
    </div>
  );
}
