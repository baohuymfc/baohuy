// CNC Studio (cnc3d-sw2) — lưu mô hình vào máy: lần đầu cần mạng, các lần sau mở ngay từ máy.
// Có mạng thì kiểm tra nhẹ (ETag, vài trăm byte) xem file có bản mới không -> lần mở sau dùng bản mới.
const C = 'cnc3d-v1';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const nha = u.origin === location.origin;
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
