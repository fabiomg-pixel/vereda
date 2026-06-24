const CACHE='vereda-v16';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./vendor-supabase.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  // Só intercepta GET do MESMO domínio. Tudo externo (api.github.com,
  // openlibrary, covers, fontes) vai direto pra rede, sem o SW no caminho.
  if(e.request.method!=='GET' || url.origin!==self.location.origin) return;
  // Network-first: pega a versão nova quando online, cai no cache se offline.
  e.respondWith(
    fetch(e.request).then(resp=>{
      const copy=resp.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
      return resp;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
  );
});

// ---- Web Push ----
self.addEventListener('push',e=>{
  let d={};
  try{d=e.data?e.data.json():{}}catch(_){d={title:'Vereda',body:e.data?e.data.text():''}}
  const title=d.title||'Vereda';
  const opts={
    body:d.body||'',
    icon:'./icon-192.png',
    badge:'./icon-192.png',
    tag:d.tag||('vereda-'+(d.habitId||'')+'-'+(d.date||'')),
    data:d,
    actions:[{action:'done',title:'✓ Feito'},{action:'skip',title:'Pular'}],
    requireInteraction:true
  };
  e.waitUntil(self.registration.showNotification(title,opts));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const d=e.notification.data||{};
  const action=e.action; // 'done' | 'skip' | '' (toque no corpo)
  e.waitUntil((async()=>{
    if((action==='done'||action==='skip')&&d.recordUrl){
      try{
        const sub=await self.registration.pushManager.getSubscription();
        await fetch(d.recordUrl,{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({endpoint:sub&&sub.endpoint,habitId:d.habitId,date:d.date,answer:action})});
        return; // registrado sem abrir o app
      }catch(err){/* cai pra abrir o app */}
    }
    const all=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const c of all){if('focus'in c)return c.focus()}
    if(self.clients.openWindow)return self.clients.openWindow('./');
  })());
});
