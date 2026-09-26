/* =========================================================
   EPS ONE — Outil « Gestion de match »
   Sports collectifs & raquettes : terrain, chrono, score, bonus,
   zones de progression, statistiques, historique
   ========================================================= */
DB.matchs = DB.matchs || [];
ICONS.match = '<rect x="2.5" y="5" width="19" height="14" rx="1.5"/><path d="M12 5v14"/><circle cx="12" cy="12" r="2.8"/><path d="M2.5 9.5h2.5v5H2.5M21.5 9.5H19v5h2.5"/>';

const SPORTS = {
  basket:   { name: 'Basket', coll: true, zones: true, shot: 'Panier', type: 'temps', dur: 8,
              score: [{ l: '+1', p: 1, sub: 'lancer franc' }, { l: '+2', p: 2, sub: 'panier' }, { l: '+3', p: 3, sub: 'à 3 points' }] },
  handball: { name: 'Handball', coll: true, zones: true, shot: 'But', type: 'temps', dur: 10, score: [{ l: 'But +1', p: 1 }] },
  football: { name: 'Football', coll: true, zones: false, shot: 'But', type: 'temps', dur: 10, score: [{ l: 'But +1', p: 1 }] },
  rugby:    { name: 'Rugby', coll: true, zones: true, shot: 'Essai', type: 'temps', dur: 10,
              score: [{ l: 'Essai +5', p: 5, try: true }, { l: 'Transfo +2', p: 2 }, { l: 'Pénalité / drop +3', p: 3 }] },
  ultimate: { name: 'Ultimate', coll: true, zones: true, shot: 'Point', type: 'temps', dur: 10, score: [{ l: 'Point +1', p: 1 }] },
  volley:   { name: 'Volley-ball', coll: false, type: 'points', target: 25, ecart: true, score: [{ l: 'Point +1', p: 1 }] },
  badminton:{ name: 'Badminton', coll: false, type: 'points', target: 21, ecart: true, score: [{ l: 'Point +1', p: 1 }] },
  shortennis:{ name: 'Shortennis', coll: false, type: 'points', target: 11, ecart: true, score: [{ l: 'Point +1', p: 1 }] },
  tennis:   { name: 'Tennis', coll: false, type: 'points', target: 11, ecart: true, score: [{ l: 'Point +1', p: 1 }] },
  escrime:  { name: 'Escrime', coll: false, touch: true, type: 'points', target: 5, ecart: false, score: [] },
  tt:       { name: 'Tennis de table', coll: false, type: 'points', target: 11, ecart: true, score: [{ l: 'Point +1', p: 1 }] },
};
const BONUS_VALUES = [1, 2, 3, 5, 10, 100, 1000];
const TOUCH_ZONES = ['Casque', 'Cou', 'Buste', 'Bras', 'Dos'];

/* ---------- Terrains (SVG, orientés en longueur) ---------- */
function courtSVG(sport) {
  const L = 'stroke="#fff" stroke-width="1.4" fill="none"';
  switch (sport) {
    case 'basket': return { vb: '0 0 280 150', bg: '#C98B4A', svg: `<rect x="5" y="5" width="270" height="140" ${L}/><line x1="140" y1="5" x2="140" y2="145" ${L}/><circle cx="140" cy="75" r="18" ${L}/>
      <rect x="5" y="51" width="58" height="48" ${L}/><rect x="217" y="51" width="58" height="48" ${L}/><circle cx="63" cy="75" r="18" ${L}/><circle cx="217" cy="75" r="18" ${L}/>
      <path d="M5 14h14a67 67 0 0 1 0 122H5M275 14h-14a67 67 0 0 0 0 122h14" ${L}/><circle cx="21" cy="75" r="4" stroke="#F26B1D" stroke-width="1.6" fill="none"/><circle cx="259" cy="75" r="4" stroke="#F26B1D" stroke-width="1.6" fill="none"/>` };
    case 'handball': return { vb: '0 0 400 200', bg: '#2F6BD8', svg: `<rect x="5" y="5" width="390" height="190" ${L}/><line x1="200" y1="5" x2="200" y2="195" ${L}/>
      <path d="M5 40a60 60 0 0 1 60 60 60 60 0 0 1-60 60M395 40a60 60 0 0 0-60 60 60 60 0 0 0 60 60" stroke="#fff" stroke-width="1.4" fill="rgba(255,255,255,.12)"/>
      <path d="M5 10a90 90 0 0 1 90 90 90 90 0 0 1-90 90M395 10a90 90 0 0 0-90 90 90 90 0 0 0 90 90" ${L} stroke-dasharray="5 5"/><rect x="0" y="85" width="5" height="30" fill="#fff"/><rect x="395" y="85" width="5" height="30" fill="#fff"/>` };
    case 'football': return { vb: '0 0 315 204', bg: '#2E8B57', svg: `<rect x="5" y="5" width="305" height="194" ${L}/><line x1="157.5" y1="5" x2="157.5" y2="199" ${L}/><circle cx="157.5" cy="102" r="27" ${L}/>
      <rect x="5" y="42" width="50" height="120" ${L}/><rect x="260" y="42" width="50" height="120" ${L}/><rect x="5" y="75" width="17" height="54" ${L}/><rect x="293" y="75" width="17" height="54" ${L}/>
      <path d="M55 82a27 27 0 0 1 0 40M260 82a27 27 0 0 0 0 40" ${L}/><rect x="0" y="91" width="5" height="22" fill="#fff"/><rect x="310" y="91" width="5" height="22" fill="#fff"/>` };
    case 'rugby': return { vb: '0 0 360 210', bg: '#3A9A55', svg: `<rect x="5" y="5" width="350" height="200" ${L}/><rect x="5" y="5" width="30" height="200" fill="rgba(255,255,255,.12)"/><rect x="325" y="5" width="30" height="200" fill="rgba(255,255,255,.12)"/>
      <line x1="35" y1="5" x2="35" y2="205" ${L}/><line x1="325" y1="5" x2="325" y2="205" ${L}/><line x1="101" y1="5" x2="101" y2="205" ${L}/><line x1="259" y1="5" x2="259" y2="205" ${L}/>
      <line x1="180" y1="5" x2="180" y2="205" ${L}/><line x1="150" y1="5" x2="150" y2="205" ${L} stroke-dasharray="5 5"/><line x1="210" y1="5" x2="210" y2="205" ${L} stroke-dasharray="5 5"/>
      <path d="M35 92v26M29 95h12M325 92v26M319 95h12" stroke="#fff" stroke-width="2"/>` };
    case 'ultimate': return { vb: '0 0 400 148', bg: '#2E8B57', svg: `<rect x="4" y="4" width="392" height="140" ${L}/><rect x="4" y="4" width="70" height="140" fill="rgba(255,255,255,.14)"/><rect x="326" y="4" width="70" height="140" fill="rgba(255,255,255,.14)"/>
      <line x1="74" y1="4" x2="74" y2="144" ${L}/><line x1="326" y1="4" x2="326" y2="144" ${L}/><line x1="200" y1="4" x2="200" y2="144" ${L} stroke-dasharray="4 6" opacity=".6"/>` };
    case 'volley': return { vb: '0 0 190 100', bg: '#E08A3C', svg: `<rect x="5" y="5" width="180" height="90" stroke="#fff" stroke-width="1.6" fill="#E9A05A"/><line x1="95" y1="0" x2="95" y2="100" stroke="#fff" stroke-width="3"/>
      <line x1="65" y1="5" x2="65" y2="95" ${L}/><line x1="125" y1="5" x2="125" y2="95" ${L}/>` };
    case 'badminton': return { vb: '0 0 268 122', bg: '#2E8B6B', svg: `<rect x="4" y="4" width="260" height="114" ${L}/><line x1="4" y1="13" x2="264" y2="13" ${L}/><line x1="4" y1="109" x2="264" y2="109" ${L}/>
      <line x1="134" y1="0" x2="134" y2="122" stroke="#fff" stroke-width="3"/><line x1="94" y1="4" x2="94" y2="118" ${L}/><line x1="174" y1="4" x2="174" y2="118" ${L}/><line x1="19" y1="4" x2="19" y2="118" ${L}/><line x1="249" y1="4" x2="249" y2="118" ${L}/>
      <line x1="4" y1="61" x2="94" y2="61" ${L}/><line x1="174" y1="61" x2="264" y2="61" ${L}/>` };
    case 'shortennis': return { vb: '0 0 268 122', bg: '#C8663A', svg: `<rect x="4" y="4" width="260" height="114" ${L}/><line x1="134" y1="0" x2="134" y2="122" stroke="#fff" stroke-width="3"/>
      <line x1="94" y1="4" x2="94" y2="118" ${L}/><line x1="174" y1="4" x2="174" y2="118" ${L}/><line x1="4" y1="61" x2="94" y2="61" ${L}/><line x1="174" y1="61" x2="264" y2="61" ${L}/>` };
    case 'tennis': return { vb: '0 0 250 124', bg: '#3C7BE0', svg: `<rect x="6" y="6" width="238" height="112" stroke="#fff" stroke-width="1.6" fill="#2E62B8"/><line x1="6" y1="20" x2="244" y2="20" ${L}/><line x1="6" y1="104" x2="244" y2="104" ${L}/>
      <line x1="125" y1="0" x2="125" y2="124" stroke="#fff" stroke-width="3"/><line x1="61" y1="20" x2="61" y2="104" ${L}/><line x1="189" y1="20" x2="189" y2="104" ${L}/><line x1="61" y1="62" x2="189" y2="62" ${L}/>` };
    case 'escrime': return { vb: '0 0 300 60', bg: '#26324A', svg: `<rect x="10" y="14" width="280" height="32" fill="#8E9BB0"/>
      <rect x="10" y="14" width="40" height="32" fill="#C0504D" opacity=".75"/><rect x="250" y="14" width="40" height="32" fill="#C0504D" opacity=".75"/>
      <rect x="10" y="14" width="280" height="32" ${L}/><line x1="150" y1="14" x2="150" y2="46" stroke="#fff" stroke-width="2"/>
      <line x1="110" y1="14" x2="110" y2="46" ${L}/><line x1="190" y1="14" x2="190" y2="46" ${L}/>
      <text x="150" y="10" text-anchor="middle" font-size="7" fill="#fff" opacity=".8">ligne médiane</text><text x="110" y="56" text-anchor="middle" font-size="6.5" fill="#fff" opacity=".8">en garde</text><text x="190" y="56" text-anchor="middle" font-size="6.5" fill="#fff" opacity=".8">en garde</text>
      <text x="30" y="56" text-anchor="middle" font-size="6.5" fill="#fff" opacity=".8">avertissement</text><text x="270" y="56" text-anchor="middle" font-size="6.5" fill="#fff" opacity=".8">avertissement</text>` };
    case 'tt': return { vb: '0 0 274 152', bg: '#1F2A44', svg: `<rect x="6" y="6" width="262" height="140" fill="#1E5BD8" stroke="#fff" stroke-width="2.5"/><line x1="6" y1="76" x2="268" y2="76" stroke="#fff" stroke-width="1"/>
      <line x1="137" y1="0" x2="137" y2="152" stroke="#fff" stroke-width="3.5"/>` };
  }
}

document.head.insertAdjacentHTML('beforeend', `<style>
.court{position:relative;border-radius:14px;overflow:hidden;box-shadow:var(--shadow)}
.court svg{display:block;width:100%;height:auto}
.zone-band{cursor:pointer}
.zone-band:active{fill:rgba(255,255,255,.35)}
.sb{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center}
.sb .tm{border-radius:16px;padding:10px 6px;text-align:center;color:#fff}
.sb .tm.a{background:linear-gradient(160deg,#D4AF37,#9C7A1E)}
.sb .tm.b{background:linear-gradient(160deg,#3C7BE0,#0B2A5B)}
.sb .tm b{display:block;font-size:clamp(2.4rem,12vw,4rem);line-height:1;font-variant-numeric:tabular-nums}
.sb .tm span{font-weight:800;font-size:.85rem;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb .ck{text-align:center}
.sb .ck b{font-size:1.6rem;font-variant-numeric:tabular-nums}
.act{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.act .col{display:flex;flex-direction:column;gap:6px}
.act h4{margin:0;text-align:center;font-size:.85rem;padding:6px;border-radius:10px;color:#fff}
.act .ca h4{background:#B8912A}.act .cb h4{background:#1E5BD8}
.act button{padding:11px 6px;border-radius:12px;font-weight:800;font-size:.85rem;border:1.5px solid var(--line);background:var(--card);line-height:1.15}
.act button small{display:block;font-weight:600;font-size:.68rem;color:var(--muted)}
.act button.sc{background:var(--grad);color:#fff;border:none}
.act button.sc small{color:rgba(255,255,255,.85)}
.bn{display:flex;flex-wrap:wrap;gap:5px}
.bn button{flex:1 1 30%;padding:8px 2px;font-size:.78rem}
.poss{display:flex;gap:8px;align-items:center;margin:10px 0 8px;font-weight:800;font-size:.85rem}
.poss button{flex:1;padding:9px;border-radius:12px;border:1.5px solid var(--line);background:var(--card);font-weight:800}
.poss button.on.a{background:#B8912A;color:#fff;border-color:transparent}
.poss button.on.b{background:#1E5BD8;color:#fff;border-color:transparent}
.tog{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.tog button{padding:9px 12px;border-radius:12px;border:1.5px solid var(--line);background:var(--card);font-weight:800;font-size:.85rem}
.tog button.on{background:var(--grad);color:#fff;border-color:transparent}
.pl-chip{padding:6px 10px;border-radius:10px;border:1.5px solid var(--line);background:var(--card);font-weight:700;font-size:.82rem;cursor:pointer}
.pl-chip.sel{background:var(--grad);color:#fff;border-color:transparent}
.mt-team{cursor:pointer}
.mt-team .pls{display:flex;flex-wrap:wrap;gap:5px}
.roster{font-size:.75rem;color:var(--muted);text-align:center;margin-top:4px}
.win{text-align:center;font-size:1.3rem;font-weight:900;padding:14px;border-radius:16px;background:var(--grad);color:#fff}
</style>`);

const RLA_BOX = '<details class="card" style="margin-top:12px"><summary style="font-weight:800;cursor:pointer">🏉 Ligne d\'avantage : recueil individuel (recule / avance / bloque)</summary><div id="rla-host" style="margin-top:10px"></div></details>';

TOOL_IMPL.match = function (el) {
  let S = { sport: 'handball', a: 'Équipe A', b: 'Équipe B', type: 'temps', dur: 10, target: 21, ecart: true, bonus: [1, 2, 5], stats: true, zones: false, nz: 4, ia: 0, ib: 1 };
  let selPl = null;
  let M = null, iv = null;
  const SP = () => SPORTS[S.sport];

  /* ===== 1. Paramètres ===== */
  function setup() {
    clearInterval(iv); M = null;
    const sp = SP();
    el.innerHTML = `<div class="card"><h3>Sport</h3><div class="tog" id="sp">${Object.entries(SPORTS).map(([k, x]) => `<button data-s="${k}" class="${k === S.sport ? 'on' : ''}">${x.name}</button>`).join('')}</div></div>
      <div class="court" style="margin-top:12px;background:${courtSVG(S.sport).bg}"><svg viewBox="${courtSVG(S.sport).vb}">${courtSVG(S.sport).svg}</svg></div>
      <div class="card" style="margin-top:12px"><h3>Équipes</h3>
        <details id="mt-d" ${DB.classes.length && !DB.matchTeams ? 'open' : ''}><summary style="font-weight:800;cursor:pointer">👥 Constituer les équipes avec les élèves d'une classe</summary><div id="mt-host" style="margin-top:6px"></div></details>
        ${teamsBlock()}
        <div class="row"><div><label>Nom équipe A</label><input id="na" value="${esc(S.a)}"></div><div><label>Nom équipe B</label><input id="nb" value="${esc(S.b)}"></div></div></div>
      <div class="card" style="margin-top:12px"><h3>Règles du match</h3>
        <div class="tog" id="ty"><button data-t="temps" class="${S.type === 'temps' ? 'on' : ''}">⏱ Match au temps</button><button data-t="points" class="${S.type === 'points' ? 'on' : ''}">🎯 Match au point</button></div>
        ${S.type === 'temps' ? `<label>Durée (minutes)</label><input id="du" type="number" min="1" value="${S.dur}">`
          : `<label>Points à atteindre</label><input id="tg" type="number" min="1" value="${S.target}"><label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="ec" ${S.ecart ? 'checked' : ''} style="width:auto"> 2 points d'écart pour gagner</label>`}
        <label>Boutons « points bonus » à afficher</label><div class="tog" id="bo">${BONUS_VALUES.map(v => `<button data-b="${v}" class="${S.bonus.includes(v) ? 'on' : ''}">+${v}</button>`).join('')}</div>
        ${sp.coll ? `<label style="display:flex;gap:8px;align-items:center;margin-top:14px"><input type="checkbox" id="st" ${S.stats ? 'checked' : ''} style="width:auto"> Statistiques : tirs tentés, ${sp.shot === 'Essai' ? 'essais' : sp.shot === 'Panier' ? 'paniers' : sp.shot === 'Point' ? 'points' : 'buts'} marqués, pertes de balle, passes décisives</label>` : ''}
        ${sp.zones ? `<label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="zo" ${S.zones ? 'checked' : ''} style="width:auto"> Zones visées (progression du ballon sur le terrain)</label>
          <div id="nzw" style="display:${S.zones ? 'block' : 'none'}"><label>Nombre de zones dans la longueur</label><div class="tog" id="nz">${[3, 4, 5].map(n => `<button data-n="${n}" class="${S.nz === n ? 'on' : ''}">${n} zones</button>`).join('')}</div></div>` : ''}
      </div>
      ${S.sport === 'rugby' ? RLA_BOX : ''}
      <button class="btn btn-grad btn-block" style="margin-top:14px;padding:16px;font-size:1.05rem" id="go">▶ Lancer le match</button>
      <div class="section-title"><h2>Historique des matchs</h2>${DB.matchs.length ? '<button class="link" id="hx">Exporter CSV</button>' : ''}</div>
      <div class="card" style="padding:0">${DB.matchs.length ? DB.matchs.slice().reverse().slice(0, 15).map((m, j) => { const i = DB.matchs.length - 1 - j;
        return `<div class="list-item"><div style="flex:1"><b>${esc(m.a)} ${m.sa} – ${m.sb} ${esc(m.b)}</b><div class="muted">${esc(SPORTS[m.sport]?.name || m.sport)} · ${new Date(m.date).toLocaleDateString('fr-FR')} ${new Date(m.date).toLocaleTimeString('fr-FR').slice(0, 5)}</div></div><button class="btn btn-ghost" data-v="${i}">👁</button><button class="btn btn-ghost" data-x="${i}">🗑</button></div>`; }).join('') : '<div class="empty">Aucun match enregistré.</div>'}</div>`;
    const $ = s => el.querySelector(s);
    const keep = () => { S.a = $('#na').value.trim() || 'Équipe A'; S.b = $('#nb').value.trim() || 'Équipe B';
      if ($('#du')) S.dur = Math.max(1, +$('#du').value || 1); if ($('#tg')) S.target = Math.max(1, +$('#tg').value || 1); if ($('#ec')) S.ecart = $('#ec').checked;
      if ($('#st')) S.stats = $('#st').checked; if ($('#zo')) S.zones = $('#zo').checked; };
    el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { keep(); S.sport = b.dataset.s; const sp = SP(); S.type = sp.type; if (sp.dur) S.dur = sp.dur; if (sp.target) S.target = sp.target; S.ecart = !!sp.ecart; if (!sp.zones) S.zones = false; setup(); });
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { keep(); S.type = b.dataset.t; setup(); });
    el.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const v = +b.dataset.b; S.bonus = S.bonus.includes(v) ? S.bonus.filter(x => x !== v) : [...S.bonus, v].sort((x, y) => x - y); b.classList.toggle('on'); });
    el.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { S.nz = +b.dataset.n; el.querySelectorAll('[data-n]').forEach(x => x.classList.toggle('on', x === b)); });
    if ($('#zo')) $('#zo').onchange = () => $('#nzw').style.display = $('#zo').checked ? 'block' : 'none';
    $('#go').onclick = () => { keep(); start(); };
    wireTeams();
    mountRLA();
    el.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { if (confirm('Supprimer ce match de l\'historique ?')) { DB.matchs.splice(+b.dataset.x, 1); save(); setup(); } });
    el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => summary(DB.matchs[+b.dataset.v], true));
    if ($('#hx')) $('#hx').onclick = () => download(`matchs-${new Date().toISOString().slice(0, 10)}.csv`, csv([
      ['Date', 'Sport', 'Équipe A', 'Score A', 'Score B', 'Équipe B', 'Tirs A', 'Marqués A', 'Pertes A', 'Passes déc. A', 'Bonus A', 'Tirs B', 'Marqués B', 'Pertes B', 'Passes déc. B', 'Bonus B', 'Joueurs A', 'Joueurs B'],
      ...DB.matchs.map(m => [new Date(m.date).toLocaleString('fr-FR'), SPORTS[m.sport]?.name || m.sport, m.a, m.sa, m.sb, m.b, ...[0, 1].flatMap(t => { const s = m.stats[t]; return [s.tirs, s.marques, s.pertes, s.passes, s.bonus]; }), (m.pa || []).join(', '), (m.pb || []).join(', ')])]));
  }

  /* ----- Rugby : ligne d'avantage intégrée ----- */
  const mountRLA = () => { const h = el.querySelector('#rla-host'); if (h && TOOL_IMPL.rugbyla) TOOL_IMPL.rugbyla(h); };

  /* ----- Équipes constituées avec les élèves ----- */
  const T = () => DB.matchTeams && DB.matchTeams.teams && DB.matchTeams.teams.length ? DB.matchTeams : null;
  const membersOf = i => (T() && T().teams[i] ? T().teams[i].members : []);
  function teamsBlock() {
    const t = T(); if (!t) return '';
    if (S.ia >= t.teams.length) S.ia = 0; if (S.ib >= t.teams.length || S.ib === S.ia) S.ib = S.ia === 0 ? Math.min(1, t.teams.length - 1) : 0;
    const opt = sel => t.teams.map((x, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
    return `<div style="margin-top:10px"><div class="muted" style="font-size:.8rem">${t.cls ? 'Classe ' + esc(t.cls) + ' · ' : ''}touchez un élève puis une autre équipe pour le déplacer.</div>
      <div class="teams">${t.teams.map((x, i) => `<div class="card team mt-team" data-tm="${i}" style="border-top:5px solid ${i === S.ia ? '#B8912A' : i === S.ib ? '#1E5BD8' : 'var(--line)'}">
        <h3><span>${esc(x.name)}${i === S.ia ? ' · A' : i === S.ib ? ' · B' : ''}</span><span class="muted">${x.members.length}</span></h3>
        <div class="pls">${x.members.map((n, j) => `<button class="pl-chip ${selPl === i + '|' + j ? 'sel' : ''}" data-pl="${i}|${j}">${esc(n)}</button>`).join('') || '<span class="muted">—</span>'}</div></div>`).join('')}</div>
      ${t.teams.length > 1 ? `<div class="row"><div><label>Équipe A (sur le terrain)</label><select id="ia">${opt(S.ia)}</select></div><div><label>Équipe B</label><select id="ib">${opt(S.ib)}</select></div></div>` : ''}
      <button class="link" id="mt-clr" style="margin-top:8px">Effacer la composition</button></div>`;
  }
  function wireTeams() {
    const $ = s => el.querySelector(s);
    const host = $('#mt-host');
    if (host) { mountComposer(host, { id: 'mt', modes: ['random', 'hetero', 'homo'], button: '🧩 Former les équipes',
      onTeams: teams => { const $n = s => el.querySelector(s); if ($n('#na')) { S.a = $n('#na').value; S.b = $n('#nb').value; }
        DB.matchTeams = { cls: el.querySelector('#mt-cls')?.value || '', teams: teams.map(x => ({ name: x.name, members: x.members.map(m => m.n) })) };
        S.ia = 0; S.ib = teams.length > 1 ? 1 : 0; S.a = teams[S.ia].name; S.b = teams[S.ib].name; selPl = null; save(); setup(); } });
      const v = el.querySelector('#mt-v'); if (v && !DB.matchTeams) v.value = 2; }
    const t = T(); if (!t) return;
    const pick = (k, i) => { S.a = $('#na').value; S.b = $('#nb').value; S[k] = i; if (k === 'ia') S.a = t.teams[i].name; else S.b = t.teams[i].name; setup(); };
    if ($('#ia')) $('#ia').onchange = e => pick('ia', +e.target.value);
    if ($('#ib')) $('#ib').onchange = e => pick('ib', +e.target.value);
    el.querySelectorAll('[data-pl]').forEach(b => b.onclick = ev => { ev.stopPropagation(); selPl = selPl === b.dataset.pl ? null : b.dataset.pl; S.a = $('#na').value; S.b = $('#nb').value; setup(); });
    el.querySelectorAll('[data-tm]').forEach(c => c.onclick = () => { if (!selPl) return; const [i, j] = selPl.split('|').map(Number), k = +c.dataset.tm; selPl = null;
      if (k !== i) { const [n] = t.teams[i].members.splice(j, 1); t.teams[k].members.push(n); save(); } S.a = $('#na').value; S.b = $('#nb').value; setup(); });
    $('#mt-clr').onclick = () => { if (!confirm('Effacer la composition des équipes ?')) return; DB.matchTeams = null; selPl = null; S.a = 'Équipe A'; S.b = 'Équipe B'; save(); setup(); };
  }

  /* ===== 2. Match ===== */
  const stats = (ev, nz) => [0, 1].map(t => {
    const e = ev.filter(x => x.team === t);
    const marques = e.filter(x => x.kind === 'score' && x.shot).length, tirsRates = e.filter(x => x.kind === 'tir').length;
    const zones = Array.from({ length: nz || 0 }, (_, z) => e.filter(x => x.kind === 'zone' && x.zone === z + 1).length);
    return { marques, tirs: marques + tirsRates, pertes: e.filter(x => x.kind === 'perte').length, passes: e.filter(x => x.kind === 'passe').length,
      bonus: e.filter(x => x.kind === 'bonus').reduce((a, x) => a + x.pts, 0), zones, touches: TOUCH_ZONES.map(z => e.filter(x => x.tz === z).length) };
  });
  const scoreOf = t => M.ev.filter(x => x.team === t && (x.kind === 'score' || x.kind === 'bonus')).reduce((a, x) => a + x.pts, 0);
  const now = () => M.acc + (M.run ? performance.now() - M.t0 : 0);

  function start() {
    M = { ev: [], acc: 0, t0: 0, run: false, poss: 0, over: false, pa: T() ? [...membersOf(S.ia)] : [], pb: T() ? [...membersOf(S.ib)] : [] };
    const sp = SP(), c = courtSVG(S.sport), zonesOn = sp.zones && S.zones;
    const vbW = +c.vb.split(' ')[2], vbH = +c.vb.split(' ')[3];
    const bands = zonesOn ? Array.from({ length: S.nz }, (_, z) => { const w = vbW / S.nz;
      return `<rect class="zone-band" data-z="${z}" x="${z * w}" y="0" width="${w}" height="${vbH}" fill="rgba(255,255,255,${z % 2 ? .06 : .14})" stroke="rgba(255,255,255,.55)" stroke-dasharray="4 4" stroke-width="1"/>
        <text x="${z * w + w / 2}" y="${vbH * .18}" text-anchor="middle" font-size="${vbH * .09}" font-weight="900" fill="#fff" opacity=".9" pointer-events="none" data-zl="${z}"></text>
        <text x="${z * w + w / 2}" y="${vbH * .92}" text-anchor="middle" font-size="${vbH * .075}" font-weight="800" fill="#fff" pointer-events="none" data-zc="${z}"></text>`; }).join('') : '';
    el.innerHTML = `<div class="sb"><div class="tm a"><span>${esc(S.a)}</span><b id="sa">0</b></div>
        <div class="ck"><div class="muted" style="font-size:.72rem;font-weight:800">${S.type === 'temps' ? 'TEMPS RESTANT' : 'TEMPS'}</div><b id="ck">${S.type === 'temps' ? fmt(S.dur * 60000, false) : '00:00'}</b>
          <div class="row" style="margin-top:6px;gap:6px"><button class="btn btn-grad" style="padding:9px 12px;font-size:.85rem" id="go">▶ Démarrer</button></div></div>
        <div class="tm b"><span>${esc(S.b)}</span><b id="sb">0</b></div></div>
      ${M.pa.length || M.pb.length ? `<div class="roster"><b style="color:#B8912A">${esc(S.a)}</b> : ${M.pa.map(esc).join(', ') || '—'}<br><b style="color:#1E5BD8">${esc(S.b)}</b> : ${M.pb.map(esc).join(', ') || '—'}</div>` : ''}
      <div class="muted" style="text-align:center;margin-top:6px;font-size:.8rem">${S.type === 'temps' ? `Match au temps · ${S.dur} min` : `Match en ${S.target} points${S.ecart ? ' (2 pts d\'écart)' : ''}`} · ${sp.name}</div>
      ${zonesOn ? `<div class="poss">Ballon :<button class="a on" data-p="0">${esc(S.a)} ➜</button><button class="b" data-p="1">⬅ ${esc(S.b)}</button></div>` : '<div style="height:10px"></div>'}
      <div class="court" style="background:${c.bg}"><svg viewBox="${c.vb}">${c.svg}${bands}</svg></div>
      ${zonesOn ? '<p class="muted" style="margin:6px 2px 0;font-size:.8rem">Touchez la zone atteinte par l\'équipe qui a le ballon. Zone 1 = son propre camp, zone ' + S.nz + ' = près du but adverse.</p>' : ''}
      <div class="act">${[0, 1].map(t => `<div class="col ${t ? 'cb' : 'ca'}"><h4>${esc(t ? S.b : S.a)}</h4>
          ${sp.touch ? TOUCH_ZONES.map(z => `<button class="sc" data-t="${t}" data-tz="${z}">Touche ${z.toLowerCase()}<small>+1</small></button>`).join('') : ''}
          ${sp.score.map((s, i) => `<button class="sc" data-t="${t}" data-sc="${i}">${s.l}${s.sub ? `<small>${s.sub}</small>` : ''}</button>`).join('')}
          ${S.bonus.length ? `<div class="bn">${S.bonus.map(v => `<button data-t="${t}" data-bo="${v}">Bonus<br>+${v}</button>`).join('')}</div>` : ''}
          ${sp.coll && S.stats ? `<button data-t="${t}" data-k="tir">🎯 Tir tenté<small>raté</small></button><button data-t="${t}" data-k="passe">🤝 Passe décisive</button><button data-t="${t}" data-k="perte">❌ Perte de balle</button>` : ''}
        </div>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn btn-ghost" id="un">↶ Annuler la dernière action</button><button class="btn btn-danger" id="end">🏁 Fin du match</button></div>
      <p class="muted" id="last" style="text-align:center;margin:8px 0"></p>
      ${S.sport === 'rugby' ? RLA_BOX : ''}`;
    const $ = s => el.querySelector(s);
    const setPoss = p => { M.poss = p; el.querySelectorAll('[data-p]').forEach(b => b.classList.toggle('on', +b.dataset.p === p)); paintZones(); };
    const add = e => { if (M.over) return; e.t = Math.round(now() / 1000); M.ev.push(e); paint(e); check(); };
    el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => setPoss(+b.dataset.p));
    el.querySelectorAll('[data-sc]').forEach(b => b.onclick = () => { const t = +b.dataset.t, s = sp.score[+b.dataset.sc];
      add({ team: t, kind: 'score', pts: s.p, label: s.l, shot: sp.coll ? (S.sport === 'rugby' ? !!s.try : true) : false }); beep(1200, .12); if (zonesOn) setPoss(1 - t); });
    el.querySelectorAll('[data-tz]').forEach(b => b.onclick = () => { add({ team: +b.dataset.t, kind: 'score', pts: 1, label: 'Touche ' + b.dataset.tz.toLowerCase(), tz: b.dataset.tz }); beep(1200, .12); });
    el.querySelectorAll('[data-bo]').forEach(b => b.onclick = () => { add({ team: +b.dataset.t, kind: 'bonus', pts: +b.dataset.bo, label: 'Bonus +' + b.dataset.bo }); beep(1500, .08); });
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const t = +b.dataset.t, k = b.dataset.k;
      add({ team: t, kind: k, pts: 0, label: { tir: 'Tir tenté', passe: 'Passe décisive', perte: 'Perte de balle' }[k] }); beep(700, .05); if (k === 'perte' && zonesOn) setPoss(1 - t); });
    el.querySelectorAll('.zone-band').forEach(r => r.onclick = () => { const z = +r.dataset.z, t = M.poss, zone = t === 0 ? z + 1 : S.nz - z;
      add({ team: t, kind: 'zone', zone, pts: 0, label: `Zone ${zone} atteinte` }); beep(900, .04); });
    $('#go').onclick = () => { if (M.over) return; if (M.run) { M.acc = now(); M.run = false; $('#go').textContent = '▶ Reprendre'; } else { M.t0 = performance.now(); M.run = true; $('#go').textContent = 'Pause'; beep(1300, .3); } };
    $('#un').onclick = () => { const e = M.ev.pop(); if (!e) return; if (M.over) M.over = false; paint(); $('#last').textContent = 'Annulé : ' + e.label + ' (' + (e.team ? S.b : S.a) + ')'; };
    $('#end').onclick = () => { if (confirm('Terminer le match ?')) finish(); };
    iv = setInterval(tick, 200); paint(); paintZones();
    mountRLA();
  }
  function paintZones() {
    if (!el.querySelector('[data-zl]')) return;
    const st = stats(M.ev, S.nz);
    for (let z = 0; z < S.nz; z++) {
      const za = z + 1, zb = S.nz - z;
      el.querySelector(`[data-zl="${z}"]`).textContent = 'Z' + (M.poss === 0 ? za : zb);
      el.querySelector(`[data-zc="${z}"]`).textContent = `A ${st[0].zones[za - 1]} · B ${st[1].zones[zb - 1]}`;
    }
  }
  function paint(e) {
    el.querySelector('#sa').textContent = scoreOf(0); el.querySelector('#sb').textContent = scoreOf(1);
    if (e) el.querySelector('#last').textContent = `${e.label} — ${e.team ? S.b : S.a}`;
    paintZones();
  }
  function tick() {
    if (!M || !el.querySelector('#ck')) return;
    const t = now();
    if (S.type === 'temps') { const left = S.dur * 60000 - t; el.querySelector('#ck').textContent = fmt(Math.max(0, left) + 999, false);
      if (left <= 0 && !M.over) { M.acc = S.dur * 60000; M.run = false; el.querySelector('#ck').textContent = '00:00'; [0, 350, 700].forEach(d => setTimeout(() => beep(700, .5), d)); finish(); } }
    else el.querySelector('#ck').textContent = fmt(t, false);
  }
  function check() {
    if (S.type !== 'points') return;
    const a = scoreOf(0), b = scoreOf(1), mx = Math.max(a, b);
    if (mx >= S.target && (!S.ecart || Math.abs(a - b) >= 2)) { [0, 350, 700].forEach(d => setTimeout(() => beep(1000, .4), d)); M.run = false; M.acc = now(); finish(); }
  }
  function finish() {
    if (!M) return; M.over = true; M.run = false; clearInterval(iv);
    const rec = { date: Date.now(), sport: S.sport, a: S.a, b: S.b, sa: scoreOf(0), sb: scoreOf(1), duree: Math.round(M.acc / 1000), nz: SP().zones && S.zones ? S.nz : 0,
      pa: M.pa, pb: M.pb, coll: SP().coll && S.stats, stats: stats(M.ev, SP().zones && S.zones ? S.nz : 0), ev: M.ev };
    summary(rec, false);
  }

  /* ===== 3. Bilan ===== */
  function summary(m, fromHistory) {
    const win = m.sa === m.sb ? 'Match nul' : `🏆 Victoire : ${esc(m.sa > m.sb ? m.a : m.b)}`, sp = SPORTS[m.sport];
    const row = (l, f) => `<tr><td>${l}</td><td><b>${f(m.stats[0], 0)}</b></td><td><b>${f(m.stats[1], 1)}</b></td></tr>`;
    el.innerHTML = `<div class="win">${win}</div>
      <div class="sb" style="margin-top:12px"><div class="tm a"><span>${esc(m.a)}</span><b>${m.sa}</b></div><div class="ck"><b>–</b><div class="muted" style="font-size:.75rem">${fmt(m.duree * 1000, false)}</div></div><div class="tm b"><span>${esc(m.b)}</span><b>${m.sb}</b></div></div>
      ${(m.pa || []).length || (m.pb || []).length ? `<div class="roster" style="margin-top:8px"><b style="color:#B8912A">${esc(m.a)}</b> : ${(m.pa || []).map(esc).join(', ') || '—'}<br><b style="color:#1E5BD8">${esc(m.b)}</b> : ${(m.pb || []).map(esc).join(', ') || '—'}</div>` : ''}
      <div class="section-title"><h2>Statistiques · ${esc(sp?.name || '')}</h2></div>
      <div class="card" style="overflow:auto"><table><tr><th></th><th>${esc(m.a)}</th><th>${esc(m.b)}</th></tr>
        ${row('Score', (s, t) => t ? m.sb : m.sa)}
        ${row('dont points bonus', s => s.bonus)}
        ${m.coll ? row(`${sp.shot}s marqués`, s => s.marques) + row('Tirs tentés', s => s.tirs) + row('Réussite', s => s.tirs ? Math.round(s.marques / s.tirs * 100) + ' %' : '–') + row('Passes décisives', s => s.passes) + row('Pertes de balle', s => s.pertes) : ''}
        ${m.nz ? Array.from({ length: m.nz }, (_, z) => row(`Zone ${z + 1} atteinte`, s => s.zones[z])).join('') : ''}
        ${m.sport === 'escrime' ? TOUCH_ZONES.map((z, i) => row(`Touches ${z.toLowerCase()}`, s => (s.touches || [])[i] || 0)).join('') : ''}
      </table>${m.nz ? `<p class="muted" style="margin:8px 0 0;font-size:.8rem">Zone 1 = camp de l'équipe, zone ${m.nz} = près du but adverse.</p>` : ''}</div>
      <div class="section-title"><h2>Déroulé du match</h2></div>
      <div class="card" style="max-height:260px;overflow:auto;padding:4px 12px">${m.ev.length ? m.ev.map(e => `<div class="muted" style="padding:4px 0;border-bottom:1px solid var(--line)"><b style="color:var(--text)">${fmt(e.t * 1000, false)}</b> · ${esc(e.team ? m.b : m.a)} · ${esc(e.label)}</div>`).join('') : '<div class="empty">Aucune action.</div>'}</div>
      <div class="row" style="margin-top:14px">${fromHistory ? '<button class="btn btn-ghost" id="bk">← Retour</button>' : '<button class="btn btn-grad" id="sv">💾 Enregistrer le match</button><button class="btn btn-ghost" id="rs">↶ Reprendre</button>'}<button class="btn btn-ghost" id="ex">📤 CSV</button></div>
      ${fromHistory ? '' : '<button class="btn btn-ghost btn-block" style="margin-top:10px" id="nw">Nouveau match sans enregistrer</button>'}`;
    const $ = s => el.querySelector(s);
    $('#ex').onclick = () => download(`match-${m.a}-${m.b}.csv`.replace(/[^\w.-]+/g, '-'), csv([['Temps', 'Équipe', 'Action', 'Points'], ...m.ev.map(e => [fmt(e.t * 1000, false), e.team ? m.b : m.a, e.label, e.pts || ''])]));
    if (fromHistory) { $('#bk').onclick = setup; return; }
    $('#sv').onclick = () => { DB.matchs.push(m); save(); toast('Match enregistré ✔'); setup(); };
    $('#nw').onclick = () => { if (confirm('Quitter sans enregistrer ?')) setup(); };
    $('#rs').onclick = () => { // revenir au match (ex. fin par erreur)
      const saved = M; start(); M.ev = saved.ev; M.acc = saved.acc; M.pa = saved.pa; M.pb = saved.pb; M.poss = saved.poss; M.over = false; paint(); tick(); };
  }

  setup();
  return () => clearInterval(iv);
};
