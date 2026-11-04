// CNC Studio — lưu mô hình vào máy: mở link lần đầu cần mạng, các lần sau mở ngay, không tải lại
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
    if (hit) return hit;
    try {
      const res = await fetch(r);
      if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone());
      return res;
    } catch (err) {
      return new Response('Chưa lưu mô hình này trong máy — mở lần đầu cần có mạng.',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  }));
});
