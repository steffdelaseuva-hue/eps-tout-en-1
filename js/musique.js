/* =========================================================
   EPS Tout en 1 — Bouton « Écouter de la musique »
   Ouvre l'application de musique installée sur l'appareil.
   ========================================================= */
ICONS.music = '<path d="M9 18V5.5l11-2.5v12.5"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/>';

const MUSIC_APPS = [
  { id: 'apple',   name: 'Apple Music (iTunes)', app: 'music://',        web: 'https://music.apple.com/' },
  { id: 'spotify', name: 'Spotify',              app: 'spotify://',      web: 'https://open.spotify.com/' },
  { id: 'deezer',  name: 'Deezer',               app: 'deezer://',       web: 'https://www.deezer.com/' },
  { id: 'ytm',     name: 'YouTube Music',        app: 'youtubemusic://', web: 'https://music.youtube.com/' },
];

function openMusicApp(i, el) {
  const a = MUSIC_APPS[i]; let left = false;
  const onHide = () => { if (document.hidden) left = true; };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('blur', onHide);
  location.href = a.app;
  setTimeout(() => {
    document.removeEventListener('visibilitychange', onHide); window.removeEventListener('blur', onHide);
    if (left) return;
    const box = el.querySelector(`[data-fb="${i}"]`);
    if (box) box.innerHTML = `<span class="muted">Application non trouvée sur cet appareil.</span> <a class="link" href="${a.web}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Ouvrir la version web</a>`;
  }, 1800);
}

function openMusic() {
  openPanel('Écouter de la musique', el => {
    el.innerHTML = `<div class="card" style="padding:0">${MUSIC_APPS.map((a, i) => `
        <div class="menu-item" data-m="${i}"><span class="mi-ic grad">${ico('music')}</span><span style="flex:1"><b>${a.name}</b><span class="muted" data-fb="${i}">Ouvrir l'application</span></span><span class="chev">›</span></div>`).join('')}</div>
      <p class="muted" style="margin:14px 4px">Lancez votre playlist puis revenez dans EPS Tout en 1 : la musique continue en fond pendant que vous utilisez les outils.</p>`;
    el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => openMusicApp(+b.dataset.m, el));
  });
}

/* Bouton dans la barre du haut, à côté de la loupe */
(() => {
  const search = document.querySelector('.topbar .icon-btn');
  if (!search) return;
  const btn = document.createElement('button');
  btn.className = 'icon-btn'; btn.setAttribute('aria-label', 'Écouter de la musique');
  btn.innerHTML = ico('music'); btn.onclick = openMusic;
  search.parentNode.insertBefore(btn, search);
  search.style.marginLeft = '8px';
})();
