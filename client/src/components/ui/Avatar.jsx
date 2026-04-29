export default function Avatar({ user, size=40, showOnline=false, ring=false, ringColor=null }) {
  const color = user?.avatar?.color || '#7c6ef5';
  const inits = user?.avatar?.initials || user?.username?.slice(0,2).toUpperCase() || '?';
  const photo = user?.avatar?.photo;

  const borderStyle = ring
    ? { border: `2.5px solid ${ringColor || 'var(--accent)'}` }
    : {};

  return (
    <div style={{position:'relative',flexShrink:0,width:size,height:size}}>
      {photo ? (
        <img src={photo} alt="" style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',display:'block',...borderStyle}}/>
      ) : (
        <div style={{width:size,height:size,borderRadius:'50%',background:`linear-gradient(145deg,${color},${color}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'white',fontSize:size*.33,userSelect:'none',flexShrink:0,...borderStyle}}>
          {inits}
        </div>
      )}
      {showOnline && (
        <span style={{position:'absolute',bottom:0,right:0,width:size*.28,height:size*.28,borderRadius:'50%',border:`${size*.06}px solid var(--bg2)`,background:user?.online?'var(--green)':'var(--bg4)',boxShadow:user?.online?'0 0 6px rgba(37,211,102,.7)':'none'}}/>
      )}
    </div>
  );
}
