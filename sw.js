// CNC Studio (cnc3d-sw3) — lưu mô hình vào máy: lần đầu cần mạng, các lần sau mở ngay từ máy.
// Link ngắn trên tem /<KHO>/<MÃ>/<ID> -> mở đúng file + đúng tấm (đọc bảng q.json, có bản lưu thì không cần mạng).
const C = 'cnc3d-v1';
const REPO = 'baohuy';
const NGAN = /^\/[^\/]+\/([A-Za-z0-9]{2,4})\/([A-Za-z0-9]+)\/?$/;
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
async function chuyen(m) {
  const goc = '/' + REPO + '/', c = await caches.open(C);
  let map = null;
  try {
    const res = await fetch(goc + 'q.json', { cache: 'no-cache' });
    if (res.ok) { await c.put(goc + 'q.json', res.clone()); map = await res.json(); }
  } catch (err) {}
  if (!map) { const h = await c.match(goc + 'q.json'); if (h) map = await h.json(); }
  const f = map && map[m[1].toUpperCase()];
  if (!f) return new Response('Không tìm thấy mô hình cho mã ' + m[1], { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  return Response.redirect(location.origin + goc + 'm/' + f + '#id=' + m[2], 302);
}
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const nha = u.origin === location.origin;
  if (nha && r.mode === 'navigate') { const m = u.pathname.match(NGAN); if (m) { e.respondWith(chuyen(m)); return; } }
  const font = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (!nha && !font) return;
  e.respondWith(caches.open(C).then(async c => {
    const hit = await c.match(r, { ignoreSearch: true });
    const moi = fetch(r, { cache: 'no-cache' }).then(async res => {
      if (res && (res.ok || res.type === 'opaque')) {
        const ky = h => (h.get('etag') || '') + '|' + (h.get('last-modified') || '') + '|' + (h.get('content-length') || '');
        const doi = hit && nha && res.ok && ky(res.headers) !== ky(hit.headers);
        await c.put(r, res.clone());
        if (doi && r.mode === 'navigate') {
          const ds = await self.clients.matchAll();
          ds.forEach(k => k.postMessage('cnc-moi'));
        }
      }
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(moi); return hit; }
    const res = await moi;
    return res || new Response('Chưa lưu mô hình này trong máy — mở lần đầu cần có mạng.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
