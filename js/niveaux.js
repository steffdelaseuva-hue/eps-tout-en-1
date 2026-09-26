/* =========================================================
   EPS ONE — Niveaux de jeu & composition d'équipes
   (hétérogène / homogène) : Composition d'équipes, Championnat,
   Tournoi, Relais
   ========================================================= */
DB.niveaux = DB.niveaux || {};
ICONS.levels = '<path d="M4 20V14M10 20V9M16 20V4"/><path d="M2.5 20h19"/>';

document.head.insertAdjacentHTML('beforeend', `<style>
.seg{display:flex;gap:6px;margin-top:6px}
.seg button{flex:1;padding:10px 6px;border-radius:12px;border:1.5px solid var(--line);background:var(--card);font-weight:800;font-size:.8rem;line-height:1.2}
.seg button.on{background:var(--grad);color:#fff;border-color:transparent}
.seg button:disabled{opacity:.4}
.lv-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line)}
.lv-row:last-child{border-bottom:none}
.lv-row span{flex:1;font-weight:700;font-size:.92rem}
.lv-b{width:40px;height:36px;border-radius:10px;border:1.5px solid var(--line);background:var(--card);font-weight:900}
.lv-b.on.l1{background:#8FB0E6;color:#fff;border-color:transparent}
.lv-b.on.l2{background:#2F6BD8;color:#fff;border-color:transparent}
.lv-b.on.l3{background:var(--gold);color:#fff;border-color:transparent}
.lv-dot{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;font-size:.68rem;font-weight:900;color:#fff;margin-right:6px;vertical-align:1px}
.lv-dot.l0{background:#B8C2D6}.lv-dot.l1{background:#8FB0E6}.lv-dot.l2{background:#2F6BD8}.lv-dot.l3{background:var(--gold)}
.lv-sum{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
.team ul{list-style:none;padding-left:0}
.team li{padding:2px 0}
</style>`);

const LV_LABEL = { 1: 'Niveau 1', 2: 'Niveau 2', 3: 'Niveau 3' };
const lvlOf = (cls, n) => (DB.niveaux[cls] || {})[n] || 0;

/* ---------- Éditeur de niveaux ---------- */
function levelSummary(cls) {
  const st = studentsOf(cls), c = [0, 0, 0, 0]; st.forEach(n => c[lvlOf(cls, n)]++);
  return `<div class="lv-sum"><span class="pill"><span class="lv-dot l3">3</span>${c[3]}</span><span class="pill"><span class="lv-dot l2">2</span>${c[2]}</span><span class="pill"><span class="lv-dot l1">1</span>${c[1]}</span>${c[0] ? `<span class="pill warn">${c[0]} non classé${c[0] > 1 ? 's' : ''}</span>` : ''}</div>`;
}
function levelEditor(box, cls, onClose) {
  const st = studentsOf(cls); DB.niveaux[cls] = DB.niveaux[cls] || {}; const L = DB.niveaux[cls];
  const draw = () => {
    box.innerHTML = `<div class="card" style="margin-top:10px;background:var(--grad-soft)">
      <div style="display:flex;justify-content:space-between;align-items:center"><b>Niveaux de jeu — ${esc(cls)}</b><button class="btn btn-grad" style="padding:8px 14px" data-close>✔ Terminé</button></div>
      <p class="muted" style="margin:6px 0">1 = débutant · 2 = intermédiaire · 3 = confirmé. Les élèves non classés comptent comme niveau 2.</p>
      ${levelSummary(cls)}
      <div class="card" style="padding:4px 12px">${st.map((n, i) => `<div class="lv-row"><span>${esc(n)}</span>${[1, 2, 3].map(l => `<button class="lv-b l${l} ${L[n] === l ? 'on' : ''}" data-i="${i}" data-l="${l}">${l}</button>`).join('')}</div>`).join('') || '<div class="empty">Classe vide.</div>'}</div></div>`;
    box.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { const n = st[b.dataset.i], l = +b.dataset.l; if (L[n] === l) delete L[n]; else L[n] = l; save(); draw(); });
    box.querySelector('[data-close]').onclick = () => { box.innerHTML = ''; onClose && onClose(); };
  };
  draw();
}

/* ---------- Algorithmes de répartition ---------- */
function composeTeams(people, count, mode, minPerLevel = 1) {
  const lv = p => p.l || 2;
  count = Math.max(1, Math.min(count, people.length));
  if (mode === 'homo') {
    const teams = [], lvls = [3, 2, 1].filter(L => people.some(p => lv(p) === L));
    // nombre d'équipes par niveau, proportionnel à l'effectif (au moins 1, total = count si possible)
    const quota = lvls.map(L => people.filter(p => lv(p) === L).length / people.length * Math.max(count, lvls.length));
    const sizes = lvls.map(L => people.filter(p => lv(p) === L).length);
    const K = quota.map((x, i) => Math.min(sizes[i], Math.max(minPerLevel, Math.floor(x))));
    let rest = Math.max(count, lvls.length) - K.reduce((a, b) => a + b, 0);
    quota.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rest > 0) { K[i]++; rest--; } });
    lvls.forEach((L, li) => {
      const g = shuffle(people.filter(p => lv(p) === L));
      const k = Math.min(K[li], g.length), T = Array.from({ length: k }, (_, i) => ({ name: `Niveau ${L} · Équipe ${String.fromCharCode(65 + i)}`, level: L, members: [] }));
      g.forEach((p, i) => T[i % k].members.push(p)); teams.push(...T);
    });
    return teams;
  }
  const T = Array.from({ length: count }, (_, i) => ({ name: `Équipe ${i + 1}`, members: [] }));
  if (mode === 'hetero') {
    const order = [3, 2, 1].flatMap(L => shuffle(people.filter(p => lv(p) === L)));
    order.forEach((p, i) => { const r = Math.floor(i / count), pos = i % count; T[r % 2 === 0 ? pos : count - 1 - pos].members.push(p); });
  } else shuffle(people).forEach((p, i) => T[i % count].members.push(p));
  return T;
}
function teamsHTML(teams, withLevels) {
  const cols = ['#C9A227', '#1E5BD8', '#B8912A', '#0B2A5B', '#3C7BE0', '#9C7A22', '#5B8DEF', '#7A5C00'];
  return `<div class="teams">${teams.map((t, i) => { const avg = t.members.reduce((a, p) => a + (p.l || 2), 0) / (t.members.length || 1);
    return `<div class="card team" style="border-top:5px solid ${t.level ? (t.level === 3 ? 'var(--gold)' : t.level === 2 ? '#2F6BD8' : '#8FB0E6') : cols[i % cols.length]}">
      <h3><span>${esc(t.name)}</span><span class="muted">${t.members.length}${withLevels ? ` · moy. ${avg.toFixed(1).replace('.', ',')}` : ''}</span></h3>
      <ul>${t.members.map(p => `<li>${withLevels ? `<span class="lv-dot l${p.l || 0}">${p.l || '–'}</span>` : ''}${esc(p.n)}</li>`).join('')}</ul></div>`; }).join('')}</div>`;
}

/* ---------- Module « Composer les équipes » réutilisable ---------- */
function mountComposer(host, { id, modes = ['random', 'hetero', 'homo'], allowFree = false, minPerLevel = 1, button = '🧩 Former les équipes', onTeams }) {
  const M = { random: ['Aléatoire', ''], hetero: ['Hétérogène', 'niveaux mélangés'], homo: ['Homogène', 'équipes de niveau'] };
  let mode = 'random';
  const q = s => host.querySelector(`#${id}-${s}`);
  host.innerHTML = `
    ${DB.classes.length || allowFree ? `<label>Classe</label><select id="${id}-cls">${allowFree ? '<option value="">— Saisie libre —</option>' : ''}${DB.classes.map(c => `<option value="${esc(c.name)}">${esc(c.name)} (${c.students.length})</option>`).join('')}</select>` : '<p class="muted">Créez d\'abord une classe dans « Mes classes ».</p>'}
    ${allowFree ? `<div id="${id}-free"><label>Élèves</label><textarea id="${id}-ta" placeholder="Un nom par ligne"></textarea></div>` : ''}
    <div id="${id}-lvz"><div id="${id}-sum"></div><button class="btn btn-ghost btn-block" id="${id}-lv"><span style="display:inline-block;width:20px;height:20px;vertical-align:-4px;margin-right:6px">${ico('levels')}</span>Classer les élèves par niveau de jeu</button><div id="${id}-box"></div></div>
    <label>Répartition</label><div class="seg" id="${id}-seg">${modes.map(m => `<button data-m="${m}">${M[m][0]}${M[m][1] ? `<br><small style="font-weight:600;opacity:.85">${M[m][1]}</small>` : ''}</button>`).join('')}</div>
    <div class="row"><div><label>Former selon</label><select id="${id}-k"><option value="n">Nombre d'équipes</option><option value="s">Élèves par équipe</option></select></div><div><label>Valeur</label><input id="${id}-v" type="number" value="4" min="1"></div></div>
    <button class="btn btn-grad btn-block" style="margin-top:12px" id="${id}-go">${button}</button>`;
  const cls = () => q('cls')?.value || '';
  const refresh = () => {
    const c = cls();
    if (q('free')) q('free').style.display = c ? 'none' : 'block';
    q('lvz').style.display = c ? 'block' : 'none';
    q('sum').innerHTML = c ? levelSummary(c) : '';
    if (!c && mode !== 'random') mode = 'random';
    host.querySelectorAll(`#${id}-seg [data-m]`).forEach(b => { b.classList.toggle('on', b.dataset.m === mode); b.disabled = !c && b.dataset.m !== 'random'; });
  };
  if (q('cls')) q('cls').onchange = () => { q('box').innerHTML = ''; refresh(); };
  q('lv').onclick = () => levelEditor(q('box'), cls(), refresh);
  host.querySelectorAll(`#${id}-seg [data-m]`).forEach(b => b.onclick = () => { mode = b.dataset.m; refresh(); });
  q('go').onclick = () => {
    const c = cls();
    const names = c ? studentsOf(c) : (q('ta')?.value || '').split(/\n|,/).map(s => s.trim()).filter(Boolean);
    if (names.length < 2) return toast('Au moins 2 élèves');
    const v = Math.max(1, +q('v').value || 1), count = q('k').value === 'n' ? v : Math.ceil(names.length / v);
    const people = names.map(n => ({ n, l: c ? lvlOf(c, n) : 0 }));
    const teams = composeTeams(people, count, mode, minPerLevel);
    beep(1000, .1); onTeams(teams, { mode, withLevels: !!c && people.some(p => p.l) });
  };
  refresh();
}

/* ---------- Composition d'équipes ---------- */
TOOL_IMPL.equipes = function (el) {
  el.innerHTML = `<div class="card" id="cmp"></div><div id="tr"></div>`;
  mountComposer(el.querySelector('#cmp'), { id: 'eq', allowFree: true,
    onTeams: (teams, o) => { el.querySelector('#tr').innerHTML = teamsHTML(teams, o.withLevels); el.querySelector('#tr').scrollIntoView({ behavior: 'smooth' }); } });
};

/* Carte repliable « Composer depuis une classe » pour les outils de match */
function composerCard(el, { id, modes, target, before, onTeams, minPerLevel }) {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<details class="card" style="margin-bottom:12px"><summary style="font-weight:800;cursor:pointer">👥 Composer les équipes depuis une classe (par niveau)</summary><div id="${id}-host" style="margin-top:6px"></div></details><div id="${id}-compo"></div>`;
  (before || el).prepend(wrap);
  mountComposer(wrap.querySelector(`#${id}-host`), { id, modes, minPerLevel, button: '🧩 Former les équipes et les utiliser',
    onTeams: (teams, o) => {
      const ta = el.querySelector(target); ta.value = teams.map(t => t.name).join('\n');
      wrap.querySelector(`#${id}-compo`).innerHTML = `<details class="card" open style="margin-bottom:12px"><summary style="font-weight:800;cursor:pointer">Composition des équipes</summary>${teamsHTML(teams, o.withLevels)}</details>`;
      wrap.querySelector('details').open = false;
      onTeams && onTeams(teams, o); toast('Équipes prêtes ✔');
    } });
}

/* ---------- Tournoi & Relais : on ajoute le module ---------- */
['tournoi', 'relais'].forEach(k => {
  const orig = TOOL_IMPL[k];
  TOOL_IMPL[k] = function (el) {
    const r = orig(el);
    composerCard(el, { id: 'c' + k, modes: ['random', 'hetero'], target: '#tl', before: el });
    return r;
  };
});

/* ---------- Championnat : une poule par niveau en mode homogène ---------- */
TOOL_IMPL.poule = function (el) {
  let teams = [], matches = [];
  el.innerHTML = `<div class="card"><label>Équipes (une par ligne)</label><textarea id="pl" style="min-height:100px">Équipe 1\nÉquipe 2\nÉquipe 3\nÉquipe 4</textarea>
    <p class="muted" style="margin:6px 0 0">Les équipes nommées « Niveau 1 · … », « Niveau 2 · … » jouent dans des poules séparées.</p>
    <div class="row"><div><label>Victoire</label><input id="pv" type="number" value="3"></div><div><label>Nul</label><input id="pn" type="number" value="2"></div><div><label>Défaite</label><input id="pd" type="number" value="1"></div></div>
    <button class="btn btn-grad btn-block" style="margin-top:12px" id="gen">🔁 Générer les rencontres</button></div><div id="out"></div>`;
  const $ = s => el.querySelector(s);
  const groupOf = t => (/^Niveau\s*(\d)/i.exec(t) || [])[1] ? 'Poule niveau ' + /^Niveau\s*(\d)/i.exec(t)[1] : '';
  const gen = () => {
    teams = namesFrom('pl'); if (teams.length < 2) return toast('Au moins 2 équipes');
    matches = [];
    const G = {}; teams.forEach(t => (G[groupOf(t)] = G[groupOf(t)] || []).push(t));
    const keys = Object.keys(G), lone = keys.filter(k => G[k].length < 2);
    if (lone.length && keys.length > 1) {            // une équipe seule dans son niveau : elle rejoint la poule la plus proche
      lone.forEach(k => { const t = G[k][0]; delete G[k]; const rest = Object.keys(G); if (!rest.length) { G[k] = [t]; return; }
        const dst = rest.sort((a, b) => Math.abs((+a.slice(-1) || 0) - (+k.slice(-1) || 0)) - Math.abs((+b.slice(-1) || 0) - (+k.slice(-1) || 0)))[0]; G[dst].push(t); });
    }
    Object.keys(G).forEach(g => {
      const t = [...G[g]]; if (t.length < 2) return;
      if (t.length % 2) t.push(null); const r = t.length - 1;
      for (let k = 0; k < r; k++) { for (let i = 0; i < t.length / 2; i++) { const x = t[i], y = t[t.length - 1 - i]; if (x && y) matches.push({ g, round: k + 1, a: x, b: y, sa: '', sb: '' }); } t.splice(1, 0, t.pop()); }
    });
    Gs = G; draw();
  };
  let Gs = {};
  const table = g => {
    const V = +$('#pv').value, N = +$('#pn').value, D = +$('#pd').value;
    const s = Object.fromEntries(teams.filter(t => Object.keys(Gs).find(k => Gs[k].includes(t)) === g).map(t => [t, { t, j: 0, g: 0, n: 0, p: 0, bp: 0, bc: 0, pts: 0 }]));
    matches.filter(m => m.g === g).forEach(m => { if (m.sa === '' || m.sb === '') return; const A = s[m.a], B = s[m.b], x = +m.sa, y = +m.sb; A.j++; B.j++; A.bp += x; A.bc += y; B.bp += y; B.bc += x;
      if (x > y) { A.g++; B.p++; A.pts += V; B.pts += D } else if (x < y) { B.g++; A.p++; B.pts += V; A.pts += D } else { A.n++; B.n++; A.pts += N; B.pts += N } });
    return Object.values(s).sort((a, b) => b.pts - a.pts || (b.bp - b.bc) - (a.bp - a.bc) || b.bp - a.bp);
  };
  const draw = () => {
    const groups = [...new Set(matches.map(m => m.g))];
    $('#out').innerHTML = groups.map(g => {
      const rk = table(g), ms = matches.map((m, i) => ({ ...m, i })).filter(m => m.g === g);
      return `<div class="section-title"><h2>${g ? esc(g) + ' — classement' : 'Classement'}</h2></div><div class="card" style="overflow:auto"><table><tr><th>#</th><th>Équipe</th><th>Pts</th><th>J</th><th>G</th><th>N</th><th>P</th><th>Diff</th></tr>${rk.map((r, i) => `<tr><td>${i + 1}</td><td><b>${esc(r.t)}</b></td><td><b>${r.pts}</b></td><td>${r.j}</td><td>${r.g}</td><td>${r.n}</td><td>${r.p}</td><td>${r.bp - r.bc}</td></tr>`).join('')}</table></div>
      <div class="section-title"><h2>${g ? esc(g) + ' — rencontres' : 'Rencontres'}</h2></div><div class="card" style="padding:0">${ms.map(m => `<div class="list-item"><span class="muted" style="width:34px">T${m.round}</span><span style="flex:1;text-align:right">${esc(m.a)}</span><input data-m="${m.i}" data-k="sa" type="number" value="${m.sa}" style="width:58px;text-align:center"><input data-m="${m.i}" data-k="sb" type="number" value="${m.sb}" style="width:58px;text-align:center"><span style="flex:1">${esc(m.b)}</span></div>`).join('')}</div>`;
    }).join('');
    $('#out').querySelectorAll('[data-m]').forEach(inp => inp.onchange = () => { matches[inp.dataset.m][inp.dataset.k] = inp.value; draw(); });
  };
  $('#gen').onclick = gen;
  composerCard(el, { id: 'cpoule', modes: ['random', 'hetero', 'homo'], target: '#pl', before: el, minPerLevel: 2 });
};

/* =========================================================
   Éditeur de groupes réutilisable (pendant une séance)
   Déplacer un élève, retirer un absent / blessé, ajouter un élève,
   créer / supprimer / renommer un groupe. Les données d'un élève
   le suivent quand il change de groupe.
   ad : { cls, indiv, list() → groupes, names(g), take(g, n) → données,
          put(g, n, données|undefined), make(nom) → groupe, rename(g, nom), onChange() }
   ========================================================= */
function editGroupsPanel(title, ad) {
  const stash = {};                                    // données des élèves retirés (restaurées s'ils reviennent)
  let sel = null;                                      // { g: index ou -1 (non placés), n }
  const o = document.createElement('div');
  o.style.cssText = 'position:fixed;inset:0;z-index:300;background:rgba(7,18,42,.72);display:grid;place-items:center;padding:12px';
  const chip = (g, n) => { const on = sel && sel.g === g && sel.n === n;
    return `<button data-s="${g}" data-n="${esc(n)}" style="padding:6px 10px;border-radius:10px;border:1.5px solid ${on ? 'transparent' : 'var(--line)'};background:${on ? 'var(--grad)' : 'var(--card)'};color:${on ? '#fff' : 'inherit'};font-weight:700;font-size:.85rem;cursor:pointer">${esc(n)}</button>`; };
  const render = () => {
    const L = ad.list(), placed = new Set(L.flatMap(g => ad.names(g))), free = (ad.cls ? studentsOf(ad.cls) : []).filter(n => !placed.has(n));
    o.innerHTML = `<div class="card" style="max-width:640px;width:100%;max-height:92vh;overflow:auto"><h3>${esc(title)}</h3>
      <p class="muted" style="margin:4px 0 10px;font-size:.82rem">${ad.indiv ? 'Touchez un élève, puis « Non placés / absents » pour le retirer, ou un élève non placé puis « Participants » pour l\'ajouter.' : 'Touchez un élève, puis le groupe de destination, ou « Non placés / absents » pour le retirer (absent, blessé…).'}</p>
      <div class="teams" style="margin-top:0">${ad.indiv
        ? `<div class="card team" data-d="new" style="cursor:pointer"><h3><span>Participants</span><span class="muted">${L.length}</span></h3><div style="display:flex;flex-wrap:wrap;gap:5px">${L.map((g, i) => chip(i, ad.names(g)[0] || '?')).join('') || '<span class="muted">—</span>'}</div></div>`
        : L.map((g, i) => `<div class="card team" data-d="${i}" style="cursor:pointer"><h3><span>${esc(g.name)}</span><span class="muted">${ad.names(g).length}</span></h3>
          <div style="display:flex;flex-wrap:wrap;gap:5px">${ad.names(g).map(n => chip(i, n)).join('') || '<span class="muted">Groupe vide</span>'}</div>
          <div class="row" style="margin-top:8px;gap:6px"><button class="btn btn-ghost" style="padding:6px" data-ren="${i}">✏️ Renommer</button><button class="btn btn-ghost" style="padding:6px" data-del="${i}">🗑 Supprimer</button></div></div>`).join('')}
        <div class="card team" data-d="-1" style="cursor:pointer;border-top:5px dashed var(--line);background:var(--grad-soft)"><h3><span>Non placés / absents</span><span class="muted">${free.length}</span></h3>
          <div style="display:flex;flex-wrap:wrap;gap:5px">${free.map(n => chip(-1, n)).join('') || '<span class="muted">—</span>'}</div></div></div>
      ${ad.indiv ? '' : '<button class="btn btn-ghost btn-block" style="margin-top:10px" id="gnew">＋ Nouveau groupe</button>'}
      <button class="btn btn-grad btn-block" style="margin-top:8px" id="gok">✔ Terminé</button></div>`;
    const done = () => { ad.onChange(); render(); };
    o.querySelectorAll('[data-s]').forEach(b => b.onclick = e => { e.stopPropagation(); const g = +b.dataset.s, n = b.dataset.n; sel = sel && sel.g === g && sel.n === n ? null : { g, n }; render(); });
    o.querySelectorAll('[data-d]').forEach(c => c.onclick = () => { if (!sel) return; const L2 = ad.list(), d = c.dataset.d, s = sel; sel = null;
      if (ad.indiv) {
        if (d === '-1' && s.g >= 0) { stash[s.n] = ad.take(L2[s.g], s.n); L2.splice(s.g, 1); }
        else if (d === 'new' && s.g === -1) { const g = ad.make(s.n); ad.put(g, s.n, stash[s.n]); L2.push(g); }
      } else {
        const to = +d; if (to === s.g) return render();
        const data = s.g >= 0 ? ad.take(L2[s.g], s.n) : stash[s.n];
        if (to >= 0) ad.put(L2[to], s.n, data); else stash[s.n] = data;
      }
      done(); });
    o.querySelectorAll('[data-ren]').forEach(b => b.onclick = e => { e.stopPropagation(); const g = ad.list()[+b.dataset.ren], n = prompt('Nom du groupe', g.name); if (n && n.trim()) { ad.rename ? ad.rename(g, n.trim()) : g.name = n.trim(); done(); } });
    o.querySelectorAll('[data-del]').forEach(b => b.onclick = e => { e.stopPropagation(); const L2 = ad.list(), g = L2[+b.dataset.del];
      if (!confirm(`Supprimer ${g.name} ? Ses élèves passent dans « Non placés ».`)) return; ad.names(g).slice().forEach(n => { stash[n] = ad.take(g, n); }); L2.splice(+b.dataset.del, 1); done(); });
    const nw = o.querySelector('#gnew'); if (nw) nw.onclick = () => { const L2 = ad.list(); L2.push(ad.make('Groupe ' + (L2.length + 1))); done(); };
    o.querySelector('#gok').onclick = () => { o.remove(); ad.onClose && ad.onClose(); };
  };
  render(); document.body.appendChild(o);
}
