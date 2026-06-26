const SB_URL = 'https://rbnsymxybhihspknfqdb.supabase.co';
const SB_KEY = 'sb_publishable_F0GVlsQeKnCyKs5DWYgWKg_H6pYhZ4M';
const SB_API = SB_URL + '/rest/v1/gjm_data';

let lastSig = '';

function getSig(d) {
  try {
    return (d.ms?d.ms.length:0)+'_'+(d.nf?d.nf.length:0)+'_'+(d.nw?d.nw.length:0)+'_'+(d.mb?d.mb.length:0);
  } catch(e) { return ''; }
}

async function fetchData() {
  try {
    const r = await fetch(SB_API+'?id=eq.1&select=payload', {
      headers: {'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}
    });
    if (!r.ok) return null;
    const rows = await r.json();
    if (!rows||!rows.length||!rows[0].payload) return null;
    return JSON.parse(rows[0].payload);
  } catch(e) { return null; }
}

async function checkForUpdates() {
  const data = await fetchData();
  if (!data) return;
  const newSig = getSig(data);
  if (newSig === lastSig) return;
  const oldParts = lastSig.split('_').map(Number);
  const newParts = newSig.split('_').map(Number);
  if (lastSig !== '') {
    if (newParts[0] > oldParts[0] && data.ms && data.ms.length) {
      const last = data.ms[data.ms.length-1];
      self.registration.showNotification('💬 Nouveau message — GJM', {
        body: (last.au||'')+': '+(last.tx||'').substring(0,80),
        icon: data.logo||'',
        tag: 'msg-'+Date.now(),
        data: {url: self.registration.scope}
      });
    }
    if (newParts[1] > oldParts[1] && data.nf && data.nf.length) {
      const last = data.nf[0];
      self.registration.showNotification('🔔 '+(last.ti||'Notification')+' — GJM', {
        body: (last.ms||'').substring(0,80),
        icon: data.logo||'',
        tag: 'nf-'+Date.now(),
        data: {url: self.registration.scope}
      });
    }
    if (newParts[2] > oldParts[2] && data.nw && data.nw.length) {
      const last = data.nw[0];
      self.registration.showNotification('📰 Nouvelle actualite — GJM', {
        body: last.ti||'',
        icon: data.logo||'',
        tag: 'nw-'+Date.now(),
        data: {url: self.registration.scope}
      });
    }
    if (newParts[3] > oldParts[3]) {
      self.registration.showNotification('👤 Nouveau membre — GJM', {
        body: "Un nouveau membre a rejoint l'association",
        icon: data.logo||'',
        tag: 'mb-'+Date.now(),
        data: {url: self.registration.scope}
      });
    }
  }
  lastSig = newSig;
}

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(function(list) {
    for (let c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow(self.registration.scope);
  }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(self.clients.claim());
  setInterval(checkForUpdates, 30000);
  checkForUpdates();
});

self.addEventListener('install', function(e) { self.skipWaiting(); });
