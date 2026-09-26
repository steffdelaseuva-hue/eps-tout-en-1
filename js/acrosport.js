/* =========================================================
   EPS ONE — Outil « Acrosport »
   Banque de pyramides (dessins originaux générés en SVG)
   Filtres : effectif (duo / trio / quatuor), position des porteurs
   (horizontal, assis, debout, trépied), hauteur, appuis au sol.
   ========================================================= */
ICONS.acrosport = '<circle cx="8" cy="12.5" r="1.6"/><path d="M4 21v-4l4-2 4 2v4M8 15v-1"/><circle cx="12" cy="4" r="1.6"/><path d="M12 6v4M9 7.5l3 1 3-1M12 10l-2 3.5M12 10l2 3.5"/><circle cx="16" cy="12.5" r="1.6"/><path d="M12 21v-4M16 15v-1M20 21v-4l-4-2"/>';

/* ---------- Poses (repère : sol y = 0, y vers le haut, personne debout ≈ 90) ---------- */
const AC = (() => {
  const arms = (n, a, m) => {
    const [x, y] = n;
    switch (a) {
      case 'up': return [[x - 7, y + 17], [x - 10, y + 34], [x + 7, y + 17], [x + 10, y + 34]];
      case 'side': return [[x - 18, y], [x - 35, y + 2], [x + 18, y], [x + 35, y + 2]];
      case 'front': return [[x + 17 * m, y - 1], [x + 34 * m, y], [x + 16 * m, y - 3], [x + 33 * m, y - 2]];
      case 'hold': return [[x + 10 * m, y - 15], [x + 24 * m, y - 9], [x + 9 * m, y - 16], [x + 22 * m, y - 11]];
      case 'upfront': return [[x + 12 * m, y + 12], [x + 24 * m, y + 26], [x + 11 * m, y + 11], [x + 22 * m, y + 25]];
      case 'hip': return [[x - 12, y - 14], [x - 5, y - 27], [x + 12, y - 14], [x + 5, y - 27]];
      default: return [[x - 5, y - 17], [x - 7, y - 34], [x + 5, y - 17], [x + 7, y - 34]];
    }
  };
  const P = (h, n, p, k1, f1, k2, f2, ar) => ({ h, n, p, k1, f1, k2, f2, e1: ar[0], m1: ar[1], e2: ar[2], m2: ar[3] });
  const poses = {
    // debout
    stand: (x, y, o) => { const m = o.m || 1, w = o.wide ? 12 : 5;
      return { j: P([x, y + 87], [x, y + 78], [x, y + 50], [x - w + 1, y + 26], [x - w, y], [x + w - 1, y + 26], [x + w, y], arms([x, y + 78], o.a, m)), sol: 2 }; },
    // debout sur une jambe, jambe arrière tendue (arabesque)
    arab: (x, y, o) => { const m = o.m || 1;
      return { j: P([x + 22 * m, y + 80], [x + 15 * m, y + 73], [x, y + 50], [x, y + 26], [x, y], [x - 24 * m, y + 55], [x - 49 * m, y + 60], arms([x + 15 * m, y + 73], o.a || 'upfront', m)), sol: 1 }; },
    // à quatre pattes (banc / table)
    table: (x, y, o) => { const m = o.m || 1;
      return { j: P([x + 27 * m, y + 42], [x + 19 * m, y + 36], [x - 16 * m, y + 27], [x - 16 * m, y], [x - 40 * m, y + 1], [x - 14 * m, y], [x - 38 * m, y + 1], [[x + 19 * m, y + 18], [x + 19 * m, y], [x + 21 * m, y + 18], [x + 21 * m, y]]), sol: 4, top: [x, y + 35] }; },
    // allongé sur le dos, jambes à la verticale
    dos: (x, y, o) => { const m = o.m || 1;
      return { j: P([x - 38 * m, y + 6], [x - 30 * m, y + 5], [x, y + 5], [x + 2 * m, y + 30], [x + 2 * m, y + 55], [x + 4 * m, y + 30], [x + 4 * m, y + 55], [[x - 30 * m, y + 22], [x - 29 * m, y + 40], [x - 28 * m, y + 22], [x - 27 * m, y + 40]]), sol: 1, top: [x + 3 * m, y + 58], hands: [x - 28 * m, y + 42] }; },
    // assis, jambes fléchies, bras tendus devant
    assis: (x, y, o) => { const m = o.m || 1;
      return { j: P([x - 3 * m, y + 44], [x - 2 * m, y + 35], [x, y + 6], [x + 21 * m, y + 26], [x + 30 * m, y], [x + 23 * m, y + 25], [x + 32 * m, y], arms([x - 2 * m, y + 35], o.a || 'front', m)), sol: 3, top: [x + 22 * m, y + 29] }; },
    // trépied (chevalier servant) : un genou + deux pieds au sol, cuisse avant horizontale
    trep: (x, y, o) => { const m = o.m || 1;
      return { j: P([x - 4 * m, y + 63], [x - 4 * m, y + 54], [x - 6 * m, y + 25], [x - 8 * m, y], [x - 32 * m, y + 1], [x + 19 * m, y + 25], [x + 19 * m, y], arms([x - 4 * m, y + 54], o.a || 'hold', m)), sol: 3, top: [x + 9 * m, y + 28] }; },
    // à genoux sur un support
    genoux: (x, y, o) => { const m = o.m || 1;
      return { j: P([x, y + 61], [x, y + 52], [x, y + 25], [x, y], [x - 25 * m, y + 1], [x + 1, y], [x - 24 * m, y + 1], arms([x, y + 52], o.a || 'side', m)), sol: 2 }; },
    // planche (corps horizontal, ventre vers le bas)
    planche: (x, y, o) => { const m = o.m || 1;
      return { j: P([x + 39 * m, y + 2], [x + 30 * m, y], [x, y], [x - 25 * m, y], [x - 51 * m, y + 1], [x - 25 * m, y + 1], [x - 51 * m, y + 2], o.a === 'side' ? [[x + 30 * m, y + 12], [x + 30 * m, y + 28], [x + 30 * m, y - 12], [x + 30 * m, y - 28]] : [[x + 47 * m, y + 1], [x + 64 * m, y + 2], [x + 47 * m, y], [x + 64 * m, y + 1]]), sol: 0 }; },
    // assis sur un support (fessier en x,y), jambes vers l'avant
    siege: (x, y, o) => { const m = o.m || 1;
      return { j: P([x - 2 * m, y + 38], [x - 1 * m, y + 29], [x, y], [x + 22 * m, y + 6], [x + 34 * m, y - 16], [x + 23 * m, y + 5], [x + 35 * m, y - 17], arms([x - 1 * m, y + 29], o.a || 'up', m)), sol: 0 }; },
    // à califourchon sur les épaules (vue de face)
    epaules: (x, y, o) => ({ j: P([x, y + 38], [x, y + 29], [x, y], [x - 10, y - 2], [x - 12, y - 24], [x + 10, y - 2], [x + 12, y - 24], arms([x, y + 29], o.a || 'up', 1)), sol: 0 }),
    // appui renversé (ATR), mains en x,y
    atr: (x, y, o) => ({ j: P([x, y + 26], [x, y + 35], [x, y + 64], [x - (o.split ? 12 : 1), y + 88], [x - (o.split ? 26 : 2), y + 112], [x + (o.split ? 12 : 1), y + 88], [x + (o.split ? 26 : 2), y + 112], [[x - 5, y + 18], [x - 4, y], [x + 5, y + 18], [x + 4, y]]), sol: y === 0 ? 2 : 0 }),
  };
  return poses;
})();

/* ---------- Banque de pyramides ----------
   por : positions de porteurs présentes · h : hauteur (étages) · p : personnes
   r 'p' porteur / 'v' voltigeur · z 1 = plan arrière (en retrait)            */
const ACRO = [
  // ===== DUOS =====
  { id: 'd1', n: 'Le banc', eff: 2, por: ['horizontal'], h: 2, p: [{ r: 'p', s: 'table', x: 0, y: 0 }, { r: 'v', s: 'stand', x: 2, y: 35, a: 'up' }],
    c: 'Voltigeur : pieds sur le bassin et les épaules du porteur, jamais au milieu du dos.' },
  { id: 'd2', n: 'La statue à genoux', eff: 2, por: ['horizontal'], h: 2, p: [{ r: 'p', s: 'table', x: 0, y: 0 }, { r: 'v', s: 'genoux', x: 4, y: 35, a: 'side' }],
    c: 'Genoux du voltigeur sur le bassin du porteur, gainage des deux.' },
  { id: 'd3', n: 'L\'avion', eff: 2, por: ['horizontal'], h: 2, p: [{ r: 'p', s: 'dos', x: 0, y: 0 }, { r: 'v', s: 'planche', x: 3, y: 58 }],
    c: 'Pieds du porteur sur le bassin du voltigeur, mains aux épaules ; montée et descente contrôlées.' },
  { id: 'd4', n: 'Le fauteuil', eff: 2, por: ['horizontal'], h: 2, p: [{ r: 'p', s: 'dos', x: 0, y: 0 }, { r: 'v', s: 'siege', x: 3, y: 58, a: 'up' }],
    c: 'Voltigeur assis sur les pieds du porteur, dos droit ; le porteur verrouille les jambes.' },
  { id: 'd5', n: 'Le chevalier', eff: 2, por: ['trepied'], h: 2, p: [{ r: 'p', s: 'trep', x: 0, y: 0 }, { r: 'v', s: 'stand', x: 9, y: 28, a: 'up' }],
    c: 'Pied du voltigeur sur la cuisse près de la hanche ; le porteur tient la taille.' },
  { id: 'd6', n: 'L\'arabesque sur cuisse', eff: 2, por: ['trepied'], h: 2, p: [{ r: 'p', s: 'trep', x: 0, y: 0, a: 'upfront' }, { r: 'v', s: 'arab', x: 9, y: 28, m: -1, a: 'side' }],
    c: 'Le porteur tient une main du voltigeur ; regard fixe devant.' },
  { id: 'd7', n: 'Sur les épaules', eff: 2, por: ['debout'], h: 2, p: [{ r: 'p', s: 'stand', x: 0, y: 0, wide: 1, a: 'hip' }, { r: 'v', s: 'epaules', x: 0, y: 80, a: 'up' }],
    c: 'Porteur jambes fléchies pour la montée, dos droit ; il tient les tibias du voltigeur.' },
  { id: 'd8', n: 'L\'ATR tenu', eff: 2, por: ['debout'], h: 1, p: [{ r: 'v', s: 'atr', x: 0, y: 0 }, { r: 'p', s: 'stand', x: 26, y: 0, m: -1, a: 'upfront' }],
    c: 'Le porteur saisit les chevilles, le voltigeur reste gainé, épaules au-dessus des mains.' },
  { id: 'd9', n: 'Le trône', eff: 2, por: ['assis'], h: 2, p: [{ r: 'p', s: 'assis', x: 0, y: 0, a: 'hold' }, { r: 'v', s: 'stand', x: 22, y: 29, a: 'side' }],
    c: 'Pieds du voltigeur sur les genoux du porteur, qui le tient aux mollets.' },

  // ===== TRIOS =====
  { id: 't1', n: 'Le double banc', eff: 3, por: ['horizontal'], h: 2, p: [{ r: 'p', s: 'table', x: 8, y: 6, z: 1 }, { r: 'p', s: 'table', x: 0, y: 0 }, { r: 'v', s: 'stand', x: 4, y: 37, a: 'up' }],
    c: 'Un pied du voltigeur sur chaque bassin ; porteurs épaule contre épaule.' },
  { id: 't2', n: 'Les deux chevaliers', eff: 3, por: ['trepied'], h: 2, p: [{ r: 'p', s: 'trep', x: -30, y: 0 }, { r: 'p', s: 'trep', x: 30, y: 0, m: -1 }, { r: 'v', s: 'stand', x: 0, y: 28, wide: 1, a: 'up' }],
    c: 'Un pied sur chaque cuisse, les porteurs tiennent les mollets.' },
  { id: 't3', n: 'La chaise à porteurs', eff: 3, por: ['debout'], h: 2, p: [{ r: 'p', s: 'stand', x: -22, y: 0, a: 'front' }, { r: 'p', s: 'stand', x: 22, y: 0, m: -1, a: 'front' }, { r: 'v', s: 'siege', x: -8, y: 76, a: 'up' }],
    c: 'Mains croisées des porteurs à hauteur de taille, voltigeur assis dessus.' },
  { id: 't4', n: 'L\'avion à deux porteurs', eff: 3, por: ['horizontal'], h: 2, p: [{ r: 'p', s: 'dos', x: -20, y: 0 }, { r: 'p', s: 'dos', x: 22, y: 0, m: -1 }, { r: 'v', s: 'planche', x: 12, y: 58 }],
    c: 'Un porteur sous le bassin, l\'autre sous les épaules ; même rythme de montée.' },
  { id: 't5', n: 'L\'éventail', eff: 3, por: ['debout'], h: 1, p: [{ r: 'v', s: 'stand', x: -34, y: 0, a: 'side' }, { r: 'p', s: 'stand', x: 0, y: 0, wide: 1, a: 'side' }, { r: 'v', s: 'stand', x: 34, y: 0, a: 'side' }],
    c: 'Voltigeurs inclinés vers l\'extérieur, mains tenues par le porteur central.' },
  { id: 't6', n: 'La pyramide 2 + 1', eff: 3, por: ['horizontal'], h: 2, p: [{ r: 'p', s: 'table', x: 8, y: 6, z: 1 }, { r: 'p', s: 'table', x: 0, y: 0 }, { r: 'v', s: 'table', x: 4, y: 37 }],
    c: 'Deux porteurs côte à côte ; le voltigeur pose les genoux sur un bassin et les mains sur l\'autre porteur, perpendiculaire aux porteurs.' },
  { id: 't7', n: 'Le trône et l\'éventail', eff: 3, por: ['assis'], h: 2, p: [{ r: 'p', s: 'assis', x: 0, y: 0, a: 'hold' }, { r: 'v', s: 'stand', x: 22, y: 29, a: 'side' }, { r: 'v', s: 'stand', x: 60, y: 0, m: -1, a: 'side' }],
    c: 'Le voltigeur au sol tient la main du voltigeur perché.' },
  { id: 't8', n: 'Chevalier et banc', eff: 3, por: ['trepied', 'horizontal'], h: 2, p: [{ r: 'p', s: 'table', x: -34, y: 0 }, { r: 'p', s: 'trep', x: 30, y: 0, m: -1 }, { r: 'v', s: 'stand', x: -2, y: 30, wide: 1, a: 'up' }],
    c: 'Un pied sur le bassin du banc, l\'autre sur la cuisse du chevalier.' },

  // ===== QUATUORS =====
  { id: 'q1', n: 'Le mur', eff: 4, por: ['horizontal'], h: 2, p: [{ r: 'p', s: 'table', x: 16, y: 12, z: 1 }, { r: 'p', s: 'table', x: 8, y: 6, z: 1 }, { r: 'p', s: 'table', x: 0, y: 0 }, { r: 'v', s: 'stand', x: 6, y: 40, wide: 1, a: 'up' }],
    c: 'Trois bancs serrés ; le voltigeur a un pied sur chaque banc extérieur.' },
  { id: 'q2', n: 'La pyramide 3 étages', eff: 4, por: ['horizontal'], h: 3, p: [{ r: 'p', s: 'table', x: 8, y: 6, z: 1 }, { r: 'p', s: 'table', x: 0, y: 0 }, { r: 'p', s: 'table', x: 4, y: 37 }, { r: 'v', s: 'genoux', x: 6, y: 72, a: 'up' }],
    c: 'Montée par l\'arrière, un pareur conseillé ; le sommet reste à genoux.' },
  { id: 'q3', n: 'Double chevalier et épaules', eff: 4, por: ['trepied', 'debout'], h: 2, p: [{ r: 'p', s: 'trep', x: -60, y: 0 }, { r: 'v', s: 'stand', x: -51, y: 28, a: 'up' }, { r: 'p', s: 'stand', x: 30, y: 0, wide: 1, a: 'hip' }, { r: 'v', s: 'epaules', x: 30, y: 80, a: 'side' }],
    c: 'Deux duos synchronisés : montée et descente au même signal.' },
  { id: 'q4', n: 'Les deux chevaliers et l\'éventail', eff: 4, por: ['trepied'], h: 2, p: [{ r: 'p', s: 'trep', x: -30, y: 0 }, { r: 'p', s: 'trep', x: 30, y: 0, m: -1 }, { r: 'v', s: 'stand', x: 0, y: 28, wide: 1, a: 'side' }, { r: 'v', s: 'arab', x: 66, y: 0, m: -1, a: 'upfront' }],
    c: 'Le 4e élève termine la figure en arabesque, main tenue.' },
  { id: 'q5', n: 'L\'avion et les banquettes', eff: 4, por: ['horizontal'], h: 2, p: [{ r: 'p', s: 'dos', x: -20, y: 0 }, { r: 'p', s: 'dos', x: 22, y: 0, m: -1 }, { r: 'v', s: 'planche', x: 12, y: 58 }, { r: 'p', s: 'table', x: 90, y: 0, m: -1 }],
    c: 'Figure à deux étages avec un banc en décor ; synchroniser les porteurs.' },
  { id: 'q6', n: 'La grande chaise', eff: 4, por: ['debout'], h: 2, p: [{ r: 'p', s: 'stand', x: -22, y: 0, a: 'front' }, { r: 'p', s: 'stand', x: 22, y: 0, m: -1, a: 'front' }, { r: 'v', s: 'siege', x: -8, y: 76, a: 'up' }, { r: 'v', s: 'stand', x: 60, y: 0, m: -1, a: 'side' }],
    c: 'Le 4e élève sécurise et tient la main du voltigeur assis.' },
  { id: 'q7', n: 'Les trônes', eff: 4, por: ['assis'], h: 2, p: [{ r: 'p', s: 'assis', x: -40, y: 0, a: 'hold' }, { r: 'v', s: 'stand', x: -18, y: 29, a: 'up' }, { r: 'p', s: 'assis', x: 40, y: 0, m: -1, a: 'hold' }, { r: 'v', s: 'stand', x: 18, y: 29, a: 'up' }],
    c: 'Deux trônes face à face, les voltigeurs se tiennent les mains au sommet.' },
  { id: 'q8', n: 'La table et l\'ATR', eff: 4, por: ['horizontal', 'debout'], h: 2, p: [{ r: 'p', s: 'table', x: -50, y: 0 }, { r: 'v', s: 'stand', x: -48, y: 35, a: 'side' }, { r: 'v', s: 'atr', x: 30, y: 0, split: 1 }, { r: 'p', s: 'stand', x: 56, y: 0, m: -1, a: 'upfront' }],
    c: 'Un duo en hauteur, un duo au sol : figures tenues 3 secondes.' },
];
const ACRO_POR = { horizontal: 'Horizontal (banc, dos)', assis: 'Assis', debout: 'Debout', trepied: 'Trépied' };
const ACRO_EFF = { 2: 'Duo', 3: 'Trio', 4: 'Quatuor' };

function acroBuild(f) { return f.p.map(q => ({ q, ...AC[q.s](q.x, q.y, q) })); }
function acroAppuis(f) { return acroBuild(f).reduce((a, b) => a + (b.q.y === 0 || b.q.z ? b.sol : 0), 0); }
function acroSVG(f, big) {
  const B = acroBuild(f), pts = B.flatMap(b => Object.values(b.j));
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs) - 12, x1 = Math.max(...xs) + 12, y1 = Math.max(...ys) + 12, W = x1 - x0, H = y1 + 6;
  const T = ([x, y]) => `${(x - x0).toFixed(1)},${(y1 - y).toFixed(1)}`;
  const draw = b => { const j = b.j, col = b.q.r === 'p' ? '#1E5BD8' : '#C9A227', op = b.q.z ? .45 : 1;
    const L = (...k) => `<polyline points="${k.map(n => T(j[n])).join(' ')}" />`;
    return `<g stroke="${col}" fill="none" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" opacity="${op}">${L('m1', 'e1', 'n', 'e2', 'm2')}${L('f1', 'k1', 'p', 'k2', 'f2')}${L('n', 'p')}<circle cx="${T(j.h).split(',')[0]}" cy="${T(j.h).split(',')[1]}" r="7" fill="${col}" stroke="none"/></g>`; };
  const order = [...B].sort((a, b) => (b.q.z || 0) - (a.q.z || 0) || (a.q.r === 'v') - (b.q.r === 'v'));
  return `<svg viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" style="width:100%;height:${big ? 'auto' : '120px'};max-height:${big ? '55vh' : '120px'}" role="img" aria-label="${esc(f.n)}">
    <line x1="0" y1="${y1.toFixed(1)}" x2="${W.toFixed(0)}" y2="${y1.toFixed(1)}" stroke="var(--line)" stroke-width="3"/>${order.map(draw).join('')}</svg>`;
}

TOOL_IMPL.acrosport = function (el) {
  const F = DB.acroFiltre || (DB.acroFiltre = { eff: 0, por: '', h: 0, app: '' });
  const APP = { '': 'Tous', a: '1 à 4', b: '5 à 8', c: '9 et +' };
  const appOk = (n, k) => !k || (k === 'a' ? n <= 4 : k === 'b' ? n >= 5 && n <= 8 : n >= 9);
  const chips = (key, opts) => `<div class="tog">${opts.map(([v, l]) => `<button data-f="${key}" data-v="${v}" class="${String(F[key]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const draw = () => {
    const list = ACRO.filter(f => (!F.eff || f.eff === +F.eff) && (!F.por || f.por.includes(F.por)) && (!F.h || f.h === +F.h) && appOk(acroAppuis(f), F.app));
    el.innerHTML = `<div class="card">
        <label style="margin-top:0">Effectif</label>${chips('eff', [[0, 'Tous'], [2, 'Duo'], [3, 'Trio'], [4, 'Quatuor']])}
        <label>Position des porteurs</label>${chips('por', [['', 'Toutes'], ...Object.entries(ACRO_POR)])}
        <label>Hauteur de la pyramide</label>${chips('h', [[0, 'Toutes'], [1, '1 étage'], [2, '2 étages'], [3, '3 étages']])}
        <label>Appuis au sol</label>${chips('app', Object.entries(APP))}</div>
      <div class="section-title"><h2>${list.length} pyramide${list.length > 1 ? 's' : ''}</h2><span class="muted" style="font-size:.8rem"><b style="color:#1E5BD8">●</b> porteur · <b style="color:#C9A227">●</b> voltigeur</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">${list.map(f => `<button class="card" data-id="${f.id}" style="text-align:left;padding:10px;cursor:pointer;border:1.5px solid var(--line)">
          ${acroSVG(f)}<b style="display:block;margin-top:6px">${esc(f.n)}</b>
          <span class="muted" style="font-size:.75rem">${ACRO_EFF[f.eff]} · ${f.h} étage${f.h > 1 ? 's' : ''} · ${acroAppuis(f)} appuis</span></button>`).join('') || '<div class="card empty" style="grid-column:1/-1">Aucune pyramide avec ces critères.</div>'}</div>`;
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { F[b.dataset.f] = b.dataset.v; save(); draw(); });
    el.querySelectorAll('[data-id]').forEach(b => b.onclick = () => detail(ACRO.find(f => f.id === b.dataset.id)));
  };
  const detail = f => {
    const o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;z-index:300;background:rgba(7,18,42,.72);display:grid;place-items:center;padding:16px';
    const nb = r => f.p.filter(q => q.r === r).length;
    o.innerHTML = `<div class="card" style="max-width:560px;width:100%;max-height:92vh;overflow:auto">
        <h3 style="font-size:1.25rem">${esc(f.n)}</h3>${acroSVG(f, true)}
        <div class="result" style="margin-top:10px"><div class="card"><b>${ACRO_EFF[f.eff]}</b><small>${nb('p')} porteur${nb('p') > 1 ? 's' : ''} · ${nb('v')} voltigeur${nb('v') > 1 ? 's' : ''}</small></div>
          <div class="card"><b>${f.h}</b><small>étage${f.h > 1 ? 's' : ''}</small></div><div class="card"><b>${acroAppuis(f)}</b><small>appuis au sol</small></div></div>
        <p style="margin:10px 0 4px"><b>Porteur${f.por.length > 1 ? 's' : ''} :</b> ${f.por.map(p => ACRO_POR[p]).join(', ')}</p>
        <p style="margin:4px 0"><b>Consigne :</b> ${esc(f.c)}</p>
        <p class="muted" style="font-size:.8rem;margin:8px 0 0">Tenir la figure 3 secondes, montée et descente contrôlées, pareur si besoin.</p>
        <button class="btn btn-grad btn-block" style="margin-top:12px" id="acx">Fermer</button></div>`;
    o.onclick = e => { if (e.target === o || e.target.id === 'acx') o.remove(); };
    document.body.appendChild(o);
  };
  draw();
};
