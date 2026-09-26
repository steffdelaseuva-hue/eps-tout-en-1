/* =========================================================
   EPS ONE — jeu d'icônes original (SVG, trait or → bleu)
   ico(nom, classe?) -> <svg>…</svg>
   ========================================================= */
const ICONS = {
  /* ---- Outils ---- */
  chrono:   '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M12 13.5l3 2M10 3h4M12 3v3M18.5 6.5l1.5-1.5"/>',
  multi:    '<circle cx="7" cy="8" r="4"/><circle cx="17" cy="8" r="4"/><circle cx="7" cy="17.5" r="4"/><circle cx="17" cy="17.5" r="4"/><path d="M7 8V6M17 8l1.4 1M7 17.5l-1.4 1M17 17.5v-2"/>',
  hiit:     '<path d="M3 20V9M7 20v-5M11 20V6M15 20v-5M19 20V4"/><path d="M2 20h20"/>',
  minuteur: '<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/><path d="M9.5 18.5h5"/>',
  photo:    '<path d="M5 21V3"/><path d="M5 4h14v9H5"/><path d="M5 4h3.5v3H5zM12 4h3.5v3H12zM8.5 7H12v3H8.5zM15.5 7H19v3h-3.5zM5 10h3.5v3H5zM12 10h3.5v3H12z" fill="url(#icoGrad)" stroke="none"/>',
  video:    '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.5l6-3.5v10l-6-3.5"/><path d="M6.5 12a2.5 2.5 0 1 0 2.5-2.5H7.5M7.5 8l-1 1.5 1.5 1"/>',
  classes:  '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.5h6V4M8.5 9.5h7M8.5 13h7M8.5 16.5h4"/>',
  tirage:   '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="8.5" cy="8.5" r=".9" fill="url(#icoGrad)"/><circle cx="15.5" cy="8.5" r=".9" fill="url(#icoGrad)"/><circle cx="12" cy="12" r=".9" fill="url(#icoGrad)"/><circle cx="8.5" cy="15.5" r=".9" fill="url(#icoGrad)"/><circle cx="15.5" cy="15.5" r=".9" fill="url(#icoGrad)"/>',
  equipes:  '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5M14 14c3.5-.8 7 1 7.5 5"/>',
  dispenses:'<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M12 8v8M8 12h8"/>',
  oubli:    '<path d="M8 3.5 3 6.5l2 4 2-1V20.5h10V9.5l2 1 2-4-5-3c-.5 1.5-2 2.5-4 2.5S8.5 5 8 3.5z"/><path d="M10 13l4 4M14 13l-4 4"/>',
  marque:   '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M12 5v14M7 9.5v5M15.5 9.5h3v2.5h-3v2.5h3"/>',
  poule:    '<circle cx="12" cy="4.5" r="2"/><circle cx="19.5" cy="12" r="2"/><circle cx="12" cy="19.5" r="2"/><circle cx="4.5" cy="12" r="2"/><path d="M13.5 6l4.5 4.5M18 13.5 13.5 18M10.5 18 6 13.5M6 10.5 10.5 6M12 6.5v11M6.5 12h11"/>',
  tournoi:  '<path d="M3 4h5v5H3M3 15h5v5H3M8 6.5h3v11H8M11 12h4M15 9h6v6h-6z"/>',
  pyramide: '<path d="M12 3 2.5 20.5h19z"/><path d="M8 10.5h8M5.2 15.5h13.6M12 10.5v5M9 15.5v5M15 15.5v5"/>',
  relais:   '<path d="M4 8h13l-3-3M20 16H7l3 3"/><rect x="9" y="6.5" width="5" height="3" rx="1.5" transform="rotate(-20 11.5 8)"/>',
  vma:      '<path d="M3.5 17a8.5 8.5 0 1 1 17 0"/><path d="M12 17l4.5-5.5"/><circle cx="12" cy="17" r="1.3"/><path d="M6 12.5l1 .6M12 8.5V9.7M18 12.5l-1 .6"/>',
  vitesse:  '<path d="M2 8h6M3 12h5M2 16h6"/><circle cx="16" cy="12" r="5.5"/><path d="M16 12V8.5M16 12l2.3 1.5"/>',
  plots:    '<path d="M3 19.5 6 8l3 11.5zM15 19.5 18 8l3 11.5z"/><path d="M4.2 14.5h3.6M16.2 14.5h3.6M2 19.5h8M14 19.5h8M10.5 12h3" /><path d="M12 10.5 13.5 12 12 13.5"/>',
  rm:       '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/><path d="M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3"/>',
  journal:  '<path d="M6 3h11.5a1.5 1.5 0 0 1 1.5 1.5v15a1.5 1.5 0 0 1-1.5 1.5H6z"/><path d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2M9.5 8h6M9.5 11.5h6M9.5 15h3.5"/>',
  grilles:  '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M7 8.5l1.5 1.5L11 7.5M7 15l1.5 1.5L11 14M13.5 9h4M13.5 15.5h4"/>',
  suivi:    '<path d="M3.5 3.5v17h17"/><path d="M7 15l4-4.5 3 2.5 5.5-6.5"/><circle cx="19.5" cy="6.5" r="1.2"/>',
  debrief:  '<path d="M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-3.5 3v-3a2 2 0 0 1-2-2z"/><path d="M19.5 9a1.5 1.5 0 0 1 1.5 1.5v4.5a1.5 1.5 0 0 1-1.5 1.5v2.5l-3-2.5h-4a1.5 1.5 0 0 1-1.5-1.5"/>',
  /* ---- Domaines ---- */
  'cat-temps':  '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 3h4M12 3v3"/>',
  'cat-classe': '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5M14 14c3.5-.8 7 1 7.5 5"/>',
  'cat-match':  '<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4.5a3 3 0 0 0 3 4M16.5 6h3a3 3 0 0 1-3 4M12 13.5V17M8.5 20.5h7M9.5 17h5v3.5h-5z"/>',
  'cat-course': '<rect x="3" y="6" width="18" height="12" rx="6"/><rect x="7" y="9.5" width="10" height="5" rx="2.5"/><path d="M12 6v3.5"/>',
  'cat-muscu':  '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  'cat-eval':   '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M7 8.5l1.5 1.5L11 7.5M7 15l1.5 1.5L11 14M13.5 9h4M13.5 15.5h4"/>',
  /* ---- Interface ---- */
  home:     '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h5v-5.5h3V20h5V9.5"/>',
  toolbox:  '<rect x="2.5" y="8" width="19" height="12" rx="2.5"/><path d="M8.5 8V5.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5V8M2.5 13h19M10 11.5v3h4v-3"/>',
  more:     '<circle cx="12" cy="12" r="9"/><circle cx="7.5" cy="12" r=".9" fill="currentColor"/><circle cx="12" cy="12" r=".9" fill="currentColor"/><circle cx="16.5" cy="12" r=".9" fill="currentColor"/>',
  search:   '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>',
  star:     '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  save:     '<path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5"/><path d="M4 15.5v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  restore:  '<path d="M12 14.5v-11M7.5 8 12 3.5 16.5 8"/><path d="M4 15.5v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  share:    '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/>',
  faq:      '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5"/><circle cx="12" cy="17" r=".9" fill="url(#icoGrad)"/>',
  lock:     '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5"/>',
  info:     '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".9" fill="url(#icoGrad)"/>',
  update:   '<path d="M19.5 12a7.5 7.5 0 0 1-13.3 4.7M4.5 12a7.5 7.5 0 0 1 13.3-4.7"/><path d="M18 3.5v4h-4M6 20.5v-4h4"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/>',
  trash:    '<path d="M4 6.5h16M9.5 6.5V4.5h5v2M6 6.5l1 14h10l1-14M10 10.5v6.5M14 10.5v6.5"/>',
  coffee:   '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H16.5M8 3.5c0 1 1 1.5 1 2.5M12 3.5c0 1 1 1.5 1 2.5"/>',
  camera:   '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r=".9" fill="url(#icoGrad)"/>',
  mail:     '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 7 8.5-7"/>',
  play:     '<rect x="2.5" y="5" width="19" height="14" rx="3.5"/><path d="M10 9v6l5-3z"/>',
  rocket:   '<path d="M12 3c3 2 4.5 5.5 4 9.5l-2 2.5h-4l-2-2.5C7.5 8.5 9 5 12 3z"/><circle cx="12" cy="9" r="1.5"/><path d="M8.5 13 5.5 16l1 3 3-2M15.5 13l3 3-1 3-3-2M12 17v4"/>',
};
function ico(name, cls = '') {
  if (name === 'chronos12') return `<img src="icons/chronos-eps.png" alt="" class="ico-img ${cls}">`;
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="url(#icoGrad)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.star}</svg>`;
}
/* Dégradé partagé par toutes les icônes */
document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="icoGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B8912A"/><stop offset=".55" stop-color="#2F6BD8"/><stop offset="1" stop-color="#0B2A5B"/></linearGradient>
    <linearGradient id="icoGradLight" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E6C76E"/><stop offset="1" stop-color="#8FB6FF"/></linearGradient></defs></svg>`);
});
/* Champs d'apprentissage */
Object.assign(ICONS, {
  'cat-perf': '<path d="M3 20.5V14h6v6.5M9 20.5V9.5h6v11M15 20.5V12.5h6v8M2 20.5h20"/><path d="M12 3.5l.9 1.8 2 .3-1.45 1.4.35 2L12 8.1l-1.8.9.35-2L9.1 5.6l2-.3z" stroke-width="1.3"/>',
  'cat-art':  '<circle cx="12" cy="4.5" r="2"/><path d="M12 7v6M12 9l-6-3M12 9l6-3M12 13l-4 7M12 13l4 7"/>',
  'cat-duel': '<path d="M4 20 14 10M14 10l2-6 4 4-6 2M20 20 10 10M10 10 8 4 4 8l6 2"/>',
  'cat-appn': '<path d="M2.5 20 9 9l4 6 3-4 5.5 9z"/><circle cx="17" cy="5" r="2"/>',
});
