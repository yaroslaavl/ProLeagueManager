/* ───────────────────────────── league.js ───────────────────────────── */
/*  Страница лиги: баннер, детали, участники, матчи, топ, отзывы        */
/*  + переходы к профилям игроков/команд                                */
/*  + эмоджи‑тональность, лайки                                         */
/*  + удаление собственных komentarzy (🗑️‑кнопка)                       */

/* ╔═ 1. AUTH & BASIC UI ══════════════════════════════════════════════╗ */
if (localStorage.accToken && localStorage.refToken) refreshToken();

async function refreshToken() {
  try {
    const r = await fetch('http://localhost:8765/auth/refresh-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.refToken}` }
    });
    if (!r.ok) throw new Error();
    const t = await r.json();
    localStorage.accToken = t.accessToken;
    localStorage.refToken = t.refreshToken;
  } catch { console.warn('token refresh failed'); }
}
async function logOut() {
  try {
    await fetch('http://localhost:8765/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.accToken}` }
    });
  } finally { localStorage.clear(); location.href = 'main.html'; }
}

if (!localStorage.accToken || !localStorage.refToken) {
  document.getElementById('notification_button')?.remove();
  const r = document.getElementById('header_right');
  if (r)
    r.innerHTML = `<a href="login.html"><div class="registerBtn"><button class="register">Zaloguj się</button></div></a>`;
}

/* toast helper */
function toast(txt, err = false) {
  const box = document.getElementById('toastContainer') ||
    (() => { const d = document.createElement('div'); d.id = 'toastContainer';
      Object.assign(d.style, { position: 'fixed', right: '30px', bottom: '30px', zIndex: 9e4 });
      document.body.appendChild(d); return d })();
  const t = document.createElement('div');
  Object.assign(t.style, {
    background: err ? '#EA3943' : '#3861FB',
    color: '#fff', padding: '10px 16px', marginTop: '8px', borderRadius: '8px',
    fontSize: '14px', boxShadow: '0 2px 6px rgba(0,0,0,.2)'
  });
  t.textContent = txt; box.appendChild(t); setTimeout(() => t.remove(), 4000);
}

/* ╔═ 2. DOMContentLoaded ═════════════════════════════════════════════╗ */
document.addEventListener('DOMContentLoaded', () => {
  const s1 = document.querySelector('.footer-content span:nth-child(3)');
  const s2 = document.querySelector('.footer-content span:nth-child(4)');
  if (s1 && s2) window.addEventListener('load', () => setTimeout(() => {
    const t = performance.timing;
    s1.innerHTML = `Strona: <span class="blue">${Math.round(t.loadEventEnd - t.navigationStart)}ms</span>`;
    s2.innerHTML = `Szablon: <span class="blue">${Math.round(t.responseEnd - t.responseStart)}ms</span>`;
  }, 0));

  loadLeagueBanner();
  loadLeagueDetails();
  loadLeagueTop();
  setupSidebarButtons();

  document.getElementById('log-out')?.addEventListener('click', logOut);
});

/* ╔═ 3. BANNER & DETAILS ═════════════════════════════════════════════╗ */
async function loadLeagueBanner() {
  const id = localStorage.searchedLeague; if (!id) return;
  try {
    const url = await fetch(`http://localhost:8765/competition/get-image/${id}`).then(r => r.text());
    document.querySelector('.banner img')?.setAttribute('src', url);
    document.querySelector('.tournament-info .avatar img')?.setAttribute('src', url);
  } catch (e) { console.error(e); }
}

let currentUserId = null;
async function getCurrentUserId() {
  if (currentUserId !== null) return currentUserId;
  if (!localStorage.accToken) return null;
  try {
    const me = await fetch('http://localhost:8765/user/profile',
      { headers: { Authorization: `Bearer ${localStorage.accToken}` } }).then(r => r.ok ? r.json() : null);
    currentUserId = me?.id ?? null;
    return currentUserId;
  } catch { return null; }
}

async function loadLeagueDetails() {
  const cid = localStorage.searchedLeague; if (!cid) return;
  try {
    const comps = await fetch('http://localhost:8765/competition/all').then(r => r.json());
    const comp = comps.find(c => c.id === cid); if (!comp) return;

    document.querySelector('.active-badge span').textContent = comp.status;
    document.querySelector('.active-badge div').style.backgroundColor =
      comp.status.toUpperCase() === 'ACTIVE' ? 'green' : 'gray';
    const regBtn = document.querySelector('.register-btn');
    if (regBtn) regBtn.style.display = comp.status.toUpperCase() === 'ACTIVE' ? 'none' : 'block';

    const sport = await fetch(`http://localhost:8765/sport/id/${comp.sportId}`).then(r => r.json());
    document.querySelector('.tournament-name strong').textContent = comp.name;
    document.querySelector('.tournament-name span').textContent = sport.name;

    const mode = (comp.name.match(/(\d+v?s\d+)/i) || ['?'])[0].replace(/vs/i, ' v ');
    let sys = {}, maxCap = '?';
    try {
      const r = await fetch(`http://localhost:8765/game-system/${comp.gameSystemId}`,
        { headers: localStorage.accToken ? { Authorization: `Bearer ${localStorage.accToken}` } : {} });
      if (r.ok) { sys = await r.json(); maxCap = sys.maxTeamSize ?? sys.playersPerTeam ?? '?'; }
    } catch { }
    const current = await fetch(`http://localhost:8765/competition/league-table/${cid}`)
      .then(r => r.json()).then(a => a.length);

    const d = document.querySelectorAll('.details div');
    if (d.length >= 4) {
      d[0].querySelector('strong').textContent = sport.name;
      d[1].querySelector('strong').textContent = mode;
      d[2].querySelector('strong').textContent = `${current} / ${maxCap}`;
      d[3].querySelector('strong').textContent =
        new Date(comp.startDate).toLocaleDateString('pl-PL');
    }

    const fbInput = document.querySelector('.feedback-input');
    if (fbInput) {
      if (await userParticipates(cid)) {
        fbInput.style.display = 'flex';
        const inp = fbInput.querySelector('input');
        const btn = fbInput.querySelector('button'); btn.disabled = true;
        inp.oninput = () => btn.disabled = !inp.value.trim();
        btn.onclick = () => sendFeedback(cid, inp, btn);
      } else fbInput.style.display = 'none';
    }
    await loadFeedbackList(cid);
  } catch (e) { console.error(e); }
}

async function userParticipates(cid) {
  const uid = await getCurrentUserId();
  if (!uid) return false;
  const myTeams = await fetch(`http://localhost:8765/team/get-teams-by-userId?userId=${uid}`)
    .then(r => r.ok ? r.json() : []).then(a => a.map(t => t.id));
  const table = await fetch(`http://localhost:8765/competition/league-table/${cid}`).then(r => r.json());
  return table.some(r => r.playerId === uid || myTeams.includes(r.teamId));
}

/* ╔═ 4. FEEDBACK ════════════════════════════════════════════════════╗ */
const toneEmoji = {
  'very positive': '😍',
  positive: '😊',
  neutral: '😐',
  negative: '😕',
  'very negative': '😡'
};

async function sendFeedback(cid, inp, btn) {
  const msg = inp.value.trim(); if (!msg) return;
  try {
    const r = await fetch(`http://localhost:8765/feedback/create/${cid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.accToken}`
      },
      body: JSON.stringify({ message: msg })
    });
    if (!r.ok) throw new Error();
    toast('Wiadomość wysłana');
    inp.value = ''; btn.disabled = true;
    loadFeedbackList(cid);
  } catch { toast('Nie udało się wysłać', true); }
}

async function loadFeedbackList(cid) {
  const box = document.querySelector('.feedback'); if (!box) return;
  box.querySelectorAll('.comment').forEach(x => x.remove());
  const myId = await getCurrentUserId();

  const list = await fetch(
    `http://localhost:8765/feedback/get-by-competition?competitionId=${cid}`
  ).then(r => r.ok ? r.json() : []);

  for (const f of list) {
    const u = await fetch(`http://localhost:8765/user/getUser/${f.userId}`).then(r => r.json());
    const av = await fetch(`http://localhost:8765/user/avatar/${u.username}`).then(r => r.text())
      .catch(() => 'img/profile.svg');
    const time = new Date(f.createdAt).toLocaleString('pl-PL',
      { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
    const emoji = toneEmoji[f.tonality?.toLowerCase()] || toneEmoji.neutral;

    const c = document.createElement('div');
    c.className = 'comment';
    c.dataset.id = f.id;
    c.innerHTML = `
      <div class="comment-header" style="display:flex;align-items:center;gap:8px">
        <div class="avatar-comment"><img src="${av || 'img/profile.svg'}"
            style="width:35px;height:35px;border-radius:50%" alt=""></div>
        <span>${u.username}</span>
        <span class="timestamp" style="margin-left:auto;color:#94a3b8">${time}</span>
        ${myId === f.userId ? `<button class="fb-del" title="Usuń komentarz"
             style="background:none;border:none;font-size:18px;cursor:pointer;line-height:1">🗑️</button>` : ''}
      </div>
      <p style="margin:10px 0 0 45px">${f.message}</p>
      <div class="comment-reactions" style="display:flex;align-items:center;gap:14px;margin:6px 0 0 auto">
        <span style="font-size:20px">${emoji}</span>
        <button class="fb-like" style="display:flex;align-items:center;gap:4px;
               background:none;border:none;cursor:pointer">
          <img src="img/thumbs-up.svg" style="width:20px;height:20px" alt="">
          <span>${f.likes}</span>
        </button>
      </div>`;
    box.appendChild(c);
  }

  /* like */
  box.querySelectorAll('.fb-like').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!localStorage.accToken) { toast('Zaloguj się', true); return; }
      const card = btn.closest('.comment');
      try {
        const r = await fetch(`http://localhost:8765/feedback/like/${card.dataset.id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${localStorage.accToken}` }
        });
        if (!r.ok) throw new Error();
        const span = btn.querySelector('span');
        span.textContent = +span.textContent + 1;
      } catch { toast('Błąd polubienia', true); }
    });
  });

  /* delete (owner only) */
  box.querySelectorAll('.fb-del').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const card = btn.closest('.comment');
      if (!confirm('Usunąć komentarz?')) return;
      try {
        const r = await fetch(`http://localhost:8765/feedback/delete/${card.dataset.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.accToken}` }
        });
        if (!r.ok) throw new Error();
        card.remove();
        toast('Usunięto komentarz');
      } catch { toast('Nie udało się usunąć', true); }
    });
  });
}

/* ╔═ 5. helpers: участник (имя+аватар+type) ══════════════════════════╗ */
async function fetchParticipant(pid, tid) {
  try {
    if (pid) {
      const u = await fetch(`http://localhost:8765/user/getUser/${pid}`).then(r => r.json());
      const img = await fetch(`http://localhost:8765/user/avatar/${u.username}`).then(r => r.text());
      return { type: 'player', name: u.username, img: img || 'img/profile.svg', username: u.username };
    }
    if (tid) {
      const t = await fetch(`http://localhost:8765/team/currentTeam/${tid}`).then(r => r.json());
      const img = await fetch(`http://localhost:8765/team/team-logo/${tid}`).then(r => r.text());
      return { type: 'team', name: t.team.teamName, img: img || 'img/default-team-avatar.png', teamName: t.team.teamName };
    }
  } catch { }
  return { type: 'unknown', name: '—', img: 'img/default-team-avatar.png' };
}
function linkToProfile(p) {
  if (p.type === 'player')
    return `open-profile.html" onclick="localStorage.setItem('searchedProfile','${p.username}')`;
  if (p.type === 'team')
    return `public-teamPage.html" onclick="localStorage.setItem('searchedTeam','${p.teamName}')`;
  return '#" onclick="return false';
}
function wrapNameHTML(p) {
  return `<a href="${linkToProfile(p)}" style="color:inherit;text-decoration:none"><strong>${p.name}</strong></a>`;
}
function arrowHTML(p) {
  return `<a href="${linkToProfile(p)}" style="display:inline-block">
            <img src="img/chevron-right.svg" style="width:18px;height:18px" alt=""></a>`;
}

/* ╔═ 6. TEAMS & TOP ══════════════════════════════════════════════════╗ */
async function loadLeagueTeams() {
  const cid = localStorage.searchedLeague; if (!cid) return;
  const tbl = await fetch(`http://localhost:8765/competition/league-table/${cid}`).then(r => r.json());
  const arr = await Promise.all(tbl.map(r => fetchParticipant(r.playerId, r.teamId)));
  arr.sort((a, b) => a.name.localeCompare(b.name, 'pl-PL'));

  const list = document.querySelector('.match-list'); list.innerHTML = ''; removeRoundControls();
  arr.forEach(p => list.insertAdjacentHTML('beforeend', `
    <div class="match">
      <div class="team-details">
        <img src="${p.img}" style="width:35px;height:35px" class="player-avatar">
        ${wrapNameHTML(p)}
      </div>
      ${arrowHTML(p)}
    </div>`));
}

async function loadLeagueTop() {
  const cid = localStorage.searchedLeague; if (!cid) return;
  const tbl = await fetch(`http://localhost:8765/competition/league-table/${cid}`).then(r => r.json());
  tbl.sort((a, b) => b.wins - a.wins);

  const list = document.querySelector('.match-list'); list.innerHTML = ''; removeRoundControls();
  for (const r of tbl) {
    const p = await fetchParticipant(r.playerId, r.teamId);
    list.insertAdjacentHTML('beforeend', `
      <div class="match">
        <div class="team-details">
          <img src="${p.img}" style="width:35px;height:35px" class="player-avatar">
          ${wrapNameHTML(p)}
        </div>
        <div class="team-place"><span>Miejsce:</span>
          <div class="badge"><strong>${r.wins}</strong><div></div></div></div>
        <div class="team-victories"><span>Zwycięstwa:</span><strong>${r.wins}</strong></div>
        ${arrowHTML(p)}
      </div>`);
  }
}

/* ╔═ 7. SIDEBAR buttons ══════════════════════════════════════════════╗ */
function setupSidebarButtons() {
  const [teams, games, top] = document.querySelectorAll('.sidebar button');
  const h3 = document.querySelector('.match-header h3');
  const act = b => document.querySelectorAll('.sidebar button')
    .forEach(x => x.classList.toggle('active', x === b));

  teams?.addEventListener('click', () => { act(teams); h3.textContent = 'Uczestnicy:'; loadLeagueTeams(); });
  games?.addEventListener('click', () => { act(games); h3.textContent = 'Mecze:'; setupMatchesTab(); });
  top  ?.addEventListener('click', () => { act(top);   h3.textContent = 'Top:';   loadLeagueTop();   });
}

/* ╔═ 8. MATCHES (round controls + avatars + ссылки) ══════════════════╗ */
let cmpId, totalR = 1, curR = 1;
async function setupMatchesTab() {
  cmpId = localStorage.searchedLeague; if (!cmpId) return;
  const tbl = await fetch(`http://localhost:8765/competition/league-table/${cmpId}`).then(r => r.json());
  totalR = tbl.length > 1 ? tbl.length - 1 : 1; curR = 1; renderRoundControls(); renderCurrentRound();
}
function renderRoundControls() {
  removeRoundControls();
  const head = document.querySelector('.match-header');
  const box = document.createElement('div'); box.className = 'round-controls';
  Object.assign(box.style, { marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' });

  const mkBtn = txt => { const b = document.createElement('button'); b.textContent = txt; return b; };
  const prev = mkBtn('‹'), next = mkBtn('›'), span = document.createElement('span'); span.className = 'round-indicator';
  const upd = () => { span.textContent = `Tura ${curR}/${totalR}`; prev.disabled = curR === 1; next.disabled = curR === totalR; };
  prev.onclick = () => { if (curR > 1) { curR--; upd(); renderCurrentRound(); } };
  next.onclick = () => { if (curR < totalR) { curR++; upd(); renderCurrentRound(); } };
  upd(); box.append(prev, span, next); head.appendChild(box);
}
function removeRoundControls() { document.querySelector('.round-controls')?.remove(); }

async function renderCurrentRound() {
  const list = document.querySelector('.match-list'); list.innerHTML = '';
  document.querySelector('.round-indicator').textContent = `Tura ${curR}/${totalR}`;
  const [prev, next] = document.querySelectorAll('.round-controls button');
  if (prev) prev.disabled = curR === 1; if (next) next.disabled = curR === totalR;

  const r = await fetch(`http://localhost:8765/match/tourMatches/${cmpId}?leagueTourNumber=${curR}`);
  if (!r.ok) { list.textContent = 'Brak meczów'; return; }
  const arr = await r.json();

  for (const m of arr) {
    const dt = new Date(m.matchDate);
    const time = dt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const date = dt.toLocaleDateString('pl-PL');
    const L = await fetchParticipant(m.playerAId, m.teamAId);
    const R = await fetchParticipant(m.playerBId, m.teamBId);

    list.insertAdjacentHTML('beforeend', `
      <div class="match"
        onmouseover="this.style.background='#EFF2F5';this.style.border='#000 1px solid'"
        onmouseout ="this.style.background='white';this.style.border='none'">
        <div><strong>${time}</strong><span> ${date}</span></div>
        <div class="team-details" style="gap:6px;align-items:center;">
          <img src="${L.img}" style="width:35px;height:35px;border-radius:50%" class="player-avatar">
          ${wrapNameHTML(L)}
          <p style="font-weight:bold;margin:0 6px;">${m.scoreA ?? '--'}</p>
          <p style="font-weight:bold">:</p>
          <p style="font-weight:bold;margin:0 6px;">${m.scoreB ?? '--'}</p>
          <img src="${R.img}" style="width:35px;height:35px;border-radius:50%" class="player-avatar">
          ${wrapNameHTML(R)}
        </div>
        <div><strong>${m.roundName || `Tura ${curR}`}</strong></div>
      </div>`);
  }
}
/* ─────────────────────────────── EOF ──────────────────────────────── */
