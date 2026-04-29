export function fmtTime(d) {
  const dt = new Date(d);
  return dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}
export function fmtDate(d) {
  const dt = new Date(d), now = new Date();
  const diff = Math.floor((now - dt) / 86400000);
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Kemarin';
  return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
export function fmtLastSeen(d) {
  if (!d) return '';
  const dt = new Date(d), now = new Date();
  const diff = Math.floor((now - dt) / 86400000);
  const t = dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (diff === 0) return `terakhir lihat ${t}`;
  if (diff === 1) return `terakhir lihat kemarin ${t}`;
  return `terakhir lihat ${dt.toLocaleDateString('id-ID', { day:'numeric', month:'short' })}`;
}
export function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
export function getMediaType(file) {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return null;
}
