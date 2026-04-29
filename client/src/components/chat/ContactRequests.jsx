import Avatar from '../ui/Avatar';

export default function ContactRequests({ requests, onAccept, onReject }) {
  if (!requests.length) return null;

  return (
    <div style={{ borderBottom:'1px solid var(--border)', background:'rgba(99,102,241,.06)' }}>
      <div style={{ padding:'8px 14px 4px' }}>
        <span style={{ fontSize:10, fontWeight:700, color:'rgba(99,102,241,.8)', textTransform:'uppercase', letterSpacing:'.8px' }}>
          Permintaan Kontak ({requests.length})
        </span>
      </div>

      {requests.map(req => (
        <div key={req.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px 8px' }}>
          <Avatar user={req.from} size={36}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {req.from?.displayName}
            </p>
            <p style={{ fontSize:11, color:'var(--text-muted)' }}>@{req.from?.username}</p>
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <button onClick={() => onAccept(req.id, req.from)}
              style={{ background:'rgba(37,211,102,.15)', border:'1px solid rgba(37,211,102,.3)', color:'#4ade80', borderRadius:8, padding:'5px 12px', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .12s' }}
              onMouseOver={e => e.target.style.background='rgba(37,211,102,.25)'}
              onMouseOut={e  => e.target.style.background='rgba(37,211,102,.15)'}>
              Terima
            </button>
            <button onClick={() => onReject(req.id)}
              style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', color:'#f87171', borderRadius:8, padding:'5px 10px', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .12s' }}
              onMouseOver={e => e.target.style.background='rgba(239,68,68,.2)'}
              onMouseOut={e  => e.target.style.background='rgba(239,68,68,.1)'}>
              Tolak
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
