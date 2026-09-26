/* =========================================================
   EPS ONE — Outil « Rugby · Ligne d'avantage »
   Recueil individuel : attaque (recule / avance), défense (bloque)
   Points = nombre d'actions · Avec bonus = actions × valeur choisie
   ========================================================= */
DB.rugbyLA = DB.rugbyLA || { obs: [], val: { recule: 1, avance: 3, bloque: 1 } };
ICONS.rugbyla = '<ellipse cx="12" cy="12" rx="7.5" ry="4.5" transform="rotate(-35 12 12)"/><path d="M9.5 14.5l5-5M10 11.5l2.5 2.5M12 9.5l2.5 2.5"/><path d="M2 21h20" stroke-dasharray="2 2"/>';

const RLA = {
  recule: { l: 'Recule', g: 'Attaque', col: '#D8433B', ic: '<path d="M30 12 12 30M12 30h13M12 30V17" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' },
  avance: { l: 'Avance', g: 'Attaque', col: '#2E9E55', ic: '<path d="M12 30 30 12M30 12H17M30 12v13" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' },
  bloque: { l: 'Bloque', g: 'Défense', col: '#1E5BD8', ic: '<rect x="9" y="9" width="24" height="24" rx="4" stroke="#fff" stroke-width="5" fill="none"/><path d="M15 21h12" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' },
};
const rlaPts = (c, v) => Object.keys(RLA).reduce((a, k) => a + (c[k] || 0), 0);
const rlaBonus = (c, v) => Object.keys(RLA).reduce((a, k) => a + (c[k] || 0) * (v[k] || 0), 0);
function rlaPie(c) {
  const tot = rlaPts(c); if (!tot) return '<div class="muted" style="text-align:center;padding:20px 0">Le graphique apparaît dès la première action.</div>';
  let a0 = -Math.PI / 2, out = '';
  Object.entries(RLA).forEach(([k, x]) => { const n = c[k] || 0; if (!n) return; const a1 = a0 + n / tot * Math.PI * 2, big = a1 - a0 > Math.PI ? 1 : 0;
    const p = (a, r) => `${(60 + r * Math.cos(a)).toFixed(2)},${(60 + r * Math.sin(a)).toFixed(2)}`;
    out += n === tot ? `<circle cx="60" cy="60" r="44" fill="none" stroke="${x.col}" stroke-width="26"/>`
      : `<path d="M${p(a0, 57)} A57 57 0 ${big} 1 ${p(a1, 57)} L${p(a1, 31)} A31 31 0 ${big} 0 ${p(a0, 31)}Z" fill="${x.col}"/>`;
    const am = (a0 + a1) / 2; out += `<text x="${(60 + 44 * Math.cos(am)).toFixed(1)}" y="${(60 + 44 * Math.sin(am) + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">${Math.round(n / tot * 100)}%</text>`;
    a0 = a1; });
  return `<div style="display:flex;align-items:center;gap:14px;justify-content:center"><svg viewBox="0 0 120 120" style="width:150px;height:150px">${out}</svg>
    <div>${Object.entries(RLA).map(([k, x]) => `<div style="display:flex;align-items:center;gap:6px;margin:4px 0;font-weight:700"><span style="width:12px;height:12px;border-radius:50%;background:${x.col}"></span>${x.l} · ${c[k] || 0}</div>`).join('')}</div></div>`;
}

TOOL_IMPL.rugbyla = function (el) {
  const R = DB.rugbyLA, V = R.val;
  if (!DB.classes.length) { el.innerHTML = noClassMsg; return; }
  let cls = DB.classes.some(c => c.name === DB.lastClass) ? DB.lastClass : DB.classes[0].name, si = 0, obs = '', C = { recule: 0, avance: 0, bloque: 0 }, hist = [];
  const draw = () => {
    const st = studentsOf(cls); if (si >= st.length) si = 0;
    el.innerHTML = `<div class="card"><div class="row"><div><label>Classe</label><select id="rc">${DB.classes.map(c => `<option ${c.name === cls ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        <div><label>🏉 Joueur</label><select id="rj">${st.map((n, k) => `<option value="${k}" ${k === si ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div></div>
        <label>👁 Observateur</label><select id="ro"><option value="">—</option>${st.map(n => `<option ${n === obs ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px">
        ${Object.entries(RLA).map(([k, x]) => `<div style="text-align:center"><div class="muted" style="font-size:.75rem;font-weight:800;text-transform:uppercase">${x.g}</div>
          <button data-add="${k}" style="width:100%;border:none;border-radius:16px;background:${x.col};color:#fff;padding:12px 4px;margin-top:4px;cursor:pointer">
            <svg viewBox="0 0 42 42" style="width:46px;height:46px">${x.ic}</svg><div style="font-weight:900;font-size:1.05rem">${x.l}</div><div style="font-size:2rem;font-weight:900;line-height:1.1">${C[k]}</div></button>
          <label style="margin:6px 0 2px;font-size:.72rem">Valeur bonus</label><select data-val="${k}" style="padding:6px">${[0, 1, 2, 3, 4, 5].map(v => `<option ${v === V[k] ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`).join('')}</div>
      <div class="result" style="margin-top:12px"><div class="card"><b>${rlaPts(C)}</b><small>points (actions)</small></div><div class="card"><b>${rlaBonus(C, V)}</b><small>avec bonus</small></div></div>
      <div class="card" style="margin-top:12px">${rlaPie(C)}</div>
      <div class="row" style="margin-top:12px"><button class="btn btn-ghost" id="ru" ${hist.length ? '' : 'disabled'}>↶ Annuler</button><button class="btn btn-ghost" id="rz">Réinitialiser</button></div>
      <button class="btn btn-grad btn-block" style="margin-top:10px" id="rs">💾 Enregistrer pour ${esc(st[si] || '—')}</button>
      <div class="section-title"><h2>Relevés · ${esc(cls)}</h2>${R.obs.some(o => o.classe === cls) ? '<button class="link" id="rx">Exporter CSV</button>' : ''}</div>
      <div class="card sheet-table">${(() => { const L = R.obs.filter(o => o.classe === cls).slice().reverse(); return L.length ? `<table><tr><th>Joueur</th><th>Date</th><th>Recule</th><th>Avance</th><th>Bloque</th><th>Points</th><th>Bonus</th><th>Observateur</th><th></th></tr>
        ${L.map(o => `<tr><td><b>${esc(o.eleve)}</b></td><td>${new Date(o.date).toLocaleDateString('fr-FR')}</td><td>${o.c.recule}</td><td>${o.c.avance}</td><td>${o.c.bloque}</td><td><b>${rlaPts(o.c)}</b></td><td><b>${rlaBonus(o.c, o.v)}</b></td><td>${esc(o.obs || '')}</td><td><button class="btn btn-ghost" style="padding:4px 8px" data-x="${o.id}">✕</button></td></tr>`).join('')}</table>` : '<div class="empty">Aucun relevé pour cette classe.</div>'; })()}</div>`;
    const $ = s => el.querySelector(s);
    $('#rc').onchange = e => { cls = e.target.value; DB.lastClass = cls; si = 0; save(); draw(); };
    $('#rj').onchange = e => { si = +e.target.value; draw(); };
    $('#ro').onchange = e => { obs = e.target.value; };
    el.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { C[b.dataset.add]++; hist.push(b.dataset.add); beep(1100, .05, .2); draw(); });
    el.querySelectorAll('[data-val]').forEach(s => s.onchange = () => { V[s.dataset.val] = +s.value; save(); draw(); });
    $('#ru').onclick = () => { const k = hist.pop(); if (k) C[k] = Math.max(0, C[k] - 1); draw(); };
    $('#rz').onclick = () => { if (rlaPts(C) && !confirm('Remettre les compteurs à zéro ?')) return; C = { recule: 0, avance: 0, bloque: 0 }; hist = []; draw(); };
    $('#rs').onclick = () => { const n = st[si]; if (!n) return toast('Classe vide'); if (!rlaPts(C)) return toast('Aucune action relevée');
      R.obs.push({ id: Date.now().toString(36), date: Date.now(), classe: cls, eleve: n, obs, c: { ...C }, v: { ...V } });
      saveResult({ tool: 'rugbyla', label: 'Ligne d\'avantage', classe: cls, eleve: n, valeur: `${rlaBonus(C, V)} pts (bonus)`, detail: `recule ${C.recule} · avance ${C.avance} · bloque ${C.bloque}` });
      toast(`${n} : enregistré ✔`); C = { recule: 0, avance: 0, bloque: 0 }; hist = []; if (si < st.length - 1) si++; draw(); };
    el.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { if (!confirm('Supprimer ce relevé ?')) return; R.obs.splice(R.obs.findIndex(o => o.id === b.dataset.x), 1); save(); draw(); });
    if ($('#rx')) $('#rx').onclick = () => download(`ligne-avantage-${cls}.csv`, csv([['Joueur', 'Date', 'Observateur', 'Recule', 'Avance', 'Bloque', 'Points', 'Avec bonus', 'Valeurs (R/A/B)'],
      ...R.obs.filter(o => o.classe === cls).map(o => [o.eleve, new Date(o.date).toLocaleDateString('fr-FR'), o.obs || '', o.c.recule, o.c.avance, o.c.bloque, rlaPts(o.c), rlaBonus(o.c, o.v), `${o.v.recule}/${o.v.avance}/${o.v.bloque}`])]));
  };
  draw();
};
