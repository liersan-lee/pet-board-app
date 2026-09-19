// Service Worker · 郊野宠物寄养工作台
// 作用：拦截顶层文档(index.html)导航请求，强制走网络(cache:'no-cache')，
// 绕过微信 / Safari / 手机浏览器对 HTML 文档的强缓存，实现打开即最新版。
// 注意：只拦截 mode==='navigate' 的顶层文档；云端 API、CDN、内联脚本等一律放行，不影响业务。
const CACHE = 'pb-sw-v1';

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // 预缓存首页，作为离线兜底（网络失败时仍能打开）
      return c.add('./').catch(function () {});
    })
  );
});

self.addEventListener('activate', function (e) {
  // 立即接管所有已打开的页面
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode !== 'navigate') return; // 仅拦截顶层文档导航，其余请求原样放行

  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(function (r) {
        try {
          var copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        } catch (_) {}
        return r;
      })
      .catch(function () {
        return caches.match(req).then(function (r) { return r || fetch(req); });
      })
  );
});
