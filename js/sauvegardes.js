/* =========================================================
   EPS ONE — Sauvegarde des résultats par classe / élève
   · Carte « Enregistrer pour un élève » ajoutée aux outils de mesure
   · Outil « Résultats des élèves » (consultation, export)
   ========================================================= */
DB.resultats = DB.resultats || [];
ICONS.resultats = '<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/><circle cx="17.5" cy="17.5" r="3.5" fill="var(--card)"/><path d="M16 17.5l1 1 2-2"/>';

const lastClass = () => (DB.classes.find(c => c.name === DB.lastClass) || DB.classes[0] || {}).name || '';
function saveResult(r) { DB.resultats.push({ date: Date.now(), ...r }); save(); }

/* Carte à ajouter en bas d'un outil.
   single: () => ({ valeur, detail })  → enregistrement pour l'élève choisi
   bulk:   () => [{ nom, valeur, detail }] → enregistrement de tous les élèves reconnus dans la classe */
function addSaveCard(el, { tool, label, single, bulk }) {
  if (!DB.classes.length) { el.insertAdjacentHTML('beforeend', `<div class="card" style="margin-top:12px"><b>💾 Enregistrer les résultats</b><p class="muted" style="margin:6px 0 0">Créez une classe dans « Mes classes » pour enregistrer les résultats des élèves.</p></div>`); return; }
  const box = document.createElement('div'); box.className = 'card'; box.style.marginTop = '12px'; el.appendChild(box);
  let cls = lastClass(), si = 0;
  const draw = () => {
    const st = studentsOf(cls), recent = DB.resultats.filter(r => r.tool === tool && r.classe === cls).slice(-5).reverse();
    box.innerHTML = `<b>💾 Enregistrer ${bulk ? 'les résultats' : 'pour un élève'}</b>
      <div class="row" style="margin-top:6px"><div><label>Classe</label><select data-sc>${DB.classes.map(c => `<option ${c.name === cls ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        ${single ? `<div><label>Élève</label><select data-ss>${st.map((n, k) => `<option value="${k}" ${k === si ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>` : ''}</div>
      ${single ? `<button class="btn btn-grad btn-block" style="margin-top:10px" data-go>💾 Enregistrer ${esc(label)} pour cet élève</button>` : ''}
      ${bulk ? `<button class="btn btn-grad btn-block" style="margin-top:10px" data-bulk>💾 Enregistrer les résultats des élèves de la classe</button><p class="muted" style="margin:6px 0 0;font-size:.78rem">Seuls les noms identiques à ceux de la classe sont enregistrés.</p>` : ''}
      ${recent.length ? `<div class="muted" style="margin-top:10px;font-size:.8rem">Derniers enregistrements : ${recent.map(r => `${esc(r.eleve)} ${esc(r.valeur)}`).join(' · ')}</div>` : ''}`;
    box.querySelector('[data-sc]').onchange = e => { cls = e.target.value; DB.lastClass = cls; si = 0; save(); draw(); };
    if (single) {
      box.querySelector('[data-ss]').onchange = e => { si = +e.target.value; };
      box.querySelector('[data-go]').onclick = () => { const v = single(); if (!v || v.valeur == null || v.valeur === '') return toast('Aucun résultat à enregistrer'); const n = st[si]; if (!n) return toast('Classe vide');
        saveResult({ tool, label, classe: cls, eleve: n, ...v }); toast(`${n} : ${v.valeur} ✔`); if (si < st.length - 1) si++; draw(); };
    }
    if (bulk) box.querySelector('[data-bulk]').onclick = () => { const rows = bulk().filter(r => st.includes(r.nom)); if (!rows.length) return toast('Aucun nom de la classe trouvé');
      rows.forEach(r => saveResult({ tool, label, classe: cls, eleve: r.nom, valeur: r.valeur, detail: r.detail || '' })); toast(`${rows.length} résultat(s) enregistré(s) ✔`); draw(); };
  };
  draw();
}

/* ---------- Branchement sur les outils de mesure ---------- */
const hook = (k, fn) => { const o = TOOL_IMPL[k]; if (!o) return; TOOL_IMPL[k] = function (el) { const r = o(el); fn(el); return r; }; };
hook('chrono', el => addSaveCard(el, { tool: 'chrono', label: 'le temps', single: () => {
  const t = el.querySelector('#c')?.textContent, laps = el.querySelectorAll('.laps li').length; return t && t !== '00:00,00' ? { valeur: t, detail: laps ? laps + ' tour(s)' : '' } : null; } }));
hook('multi', el => addSaveCard(el, { tool: 'multi', label: 'les temps', bulk: () => [...el.querySelectorAll('.mc')].filter(c => c.classList.contains('done')).map(c => ({ nom: c.querySelector('input').value.trim(), valeur: c.querySelector('.t').textContent })) }));
hook('vma', el => addSaveCard(el, { tool: 'vma', label: 'la VMA', single: () => ({ valeur: (el.querySelector('#v').value || '').replace('.', ',') + ' km/h', detail: 'VMA' }) }));
hook('vitesse', el => addSaveCard(el, { tool: 'vitesse', label: 'la vitesse', single: () => { const b = el.querySelector('#res .card b'); return b ? { valeur: b.textContent + ' km/h', detail: `${el.querySelector('#d').value} m en ${el.querySelector('#m').value} min ${el.querySelector('#s').value} s` } : null; } }));
hook('rm', el => addSaveCard(el, { tool: 'rm', label: 'la 1RM', single: () => { const b = el.querySelector('#res .card b'); return b ? { valeur: b.textContent, detail: `${el.querySelector('#c').value} kg × ${el.querySelector('#r').value} rép.` } : null; } }));
hook('testvma', el => { const add = () => { el.querySelector('.card[data-tvsave]')?.remove(); const holder = document.createElement('div'); el.appendChild(holder);
    addSaveCard(holder, { tool: 'testvma', label: 'la VMA', bulk: () => [...el.querySelectorAll('.tv-row.done')].map(r => ({ nom: r.querySelector('.nm').textContent.trim(), valeur: (r.querySelector('.res b')?.textContent || '').replace('VMA ', ''), detail: r.querySelector('.res')?.textContent.split('\n')[0] || '' })) }); };
  add(); new MutationObserver(() => { if (!el.querySelector('[data-bulk]')) add(); }).observe(el, { childList: true }); });
hook('photo', el => addSaveCard(el, { tool: 'photo', label: 'les temps d\'arrivée', bulk: () => [...el.querySelectorAll('#ml .list-item')].map(r => { const s = r.querySelectorAll('span'), b = r.querySelectorAll('b'); return { nom: s[0]?.textContent.trim(), valeur: b[1]?.textContent }; }) }));
hook('chronos12', el => { const bar = el.querySelector('.chronos-bar'); if (!bar || !DB.classes.length) return;
  const btn = document.createElement('button'); btn.className = 'btn btn-grad'; btn.textContent = '💾 Enregistrer les temps'; bar.appendChild(btn);
  btn.onclick = () => { let S; try { S = JSON.parse(localStorage.getItem('chronos-eps-v1')); } catch (e) {} if (!Array.isArray(S)) return toast('Aucun temps');
    const cls = prompt('Classe (nom exact) :', lastClass()); if (!cls) return; const st = studentsOf(cls); if (!st.length) return toast('Classe introuvable');
    const now = Date.now(); let n = 0;
    S.slice(1).forEach(c => { const t = c.accumulated + (c.running ? now - c.startedAt : 0), name = (c.name || '').trim(); if (t > 0 && st.includes(name)) { saveResult({ tool: 'chronos12', label: 'Chronos EPS', classe: cls, eleve: name, valeur: fmt(t), detail: c.laps.length ? c.laps.length + ' tour(s)' : '' }); n++; } });
    toast(n ? `${n} temps enregistré(s) ✔` : 'Aucun prénom de la classe trouvé'); }; });

/* ---------- Outil « Résultats des élèves » ---------- */
const TOOL_NAMES = () => Object.fromEntries(TOOLS.map(t => [t.id, t.name]));
TOOL_IMPL.resultats = function (el) {
  if (!DB.classes.length) { el.innerHTML = noClassMsg; return; }
  let cls = lastClass(), who = '';
  const draw = () => {
    const names = TOOL_NAMES(), st = studentsOf(cls);
    const rows = DB.resultats.map((r, i) => ({ ...r, i })).filter(r => r.classe === cls && (!who || r.eleve === who)).reverse();
    el.innerHTML = `<div class="card"><div class="row"><div><label>Classe</label><select id="rc">${DB.classes.map(c => `<option ${c.name === cls ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        <div><label>Élève</label><select id="re"><option value="">Tous</option>${st.map(n => `<option ${n === who ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div></div></div>
      <div class="section-title"><h2>Résultats enregistrés (${rows.length})</h2><button class="link" id="exp">Exporter CSV</button></div>
      <div class="card sheet-table">${rows.length ? `<table><tr><th>Date</th><th>Élève</th><th>Outil</th><th>Résultat</th><th>Détail</th><th></th></tr>
        ${rows.map(r => `<tr><td>${new Date(r.date).toLocaleDateString('fr-FR')}</td><td><b>${esc(r.eleve)}</b></td><td>${esc(names[r.tool] || r.tool)}</td><td><b>${esc(r.valeur)}</b></td><td class="muted">${esc(r.detail || '')}</td><td><button class="btn btn-ghost" style="padding:4px 8px" data-x="${r.i}">✕</button></td></tr>`).join('')}</table>`
        : '<div class="empty">Aucun résultat. Utilisez la carte « 💾 Enregistrer » en bas des outils (chronomètre, multi-chrono, Test VMA, 1RM…).</div>'}</div>`;
    const $ = s => el.querySelector(s);
    $('#rc').onchange = () => { cls = $('#rc').value; DB.lastClass = cls; who = ''; save(); draw(); };
    $('#re').onchange = () => { who = $('#re').value; draw(); };
    el.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { if (confirm('Supprimer ce résultat ?')) { DB.resultats.splice(+b.dataset.x, 1); save(); draw(); } });
    $('#exp').onclick = () => { if (!rows.length) return toast('Rien à exporter');
      download(`resultats-${cls}${who ? '-' + who : ''}.csv`, csv([['Date', 'Classe', 'Élève', 'Outil', 'Résultat', 'Détail'], ...rows.slice().reverse().map(r => [new Date(r.date).toLocaleDateString('fr-FR'), r.classe, r.eleve, names[r.tool] || r.tool, r.valeur, r.detail || ''])])); };
  };
  draw();
};
