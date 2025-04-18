/* ─────────────────────────── tournaments.js ────────────────────────── */
/*  Публичная страница ТУРНИРА (single‑elimination, cup)                */
/*  ▸ Баннер + детали  ▸ Teams / Games                                  */
/*  ▸ Games‑nav «Future | Present | Past» показывается только в Games   */
/*  ▸ Ссылки‑стрелочки к профилям игроков / команд                      */
/*  ▸ Feedback (добавить / лайк / удалить‑своё, emoji‑тональность)      */

/* ╔═ 0. CONSTS ════════════════════════════════════════════════════════╗ */
const API     = 'http://localhost:8765';
const COMP_ID = localStorage.getItem('searchedTournament');
if (!COMP_ID) location.href = 'main.html';

const toneEmoji = {
  'very positive': '😍',  positive: '😊',
  neutral:        '😐',  negative: '😕',  'very negative': '😡'
};

/* ╔═ 1. AUTH & BASIC UI ═══════════════════════════════════════════════╗ */
if (localStorage.accToken && localStorage.refToken) refreshToken();

async function refreshToken() {
  try {
    const r = await fetch(`${API}/auth/refresh-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.refToken}` }
    });
    if (!r.ok) throw new Error();
    const t = await r.json();
    localStorage.accToken = t.accessToken;
    localStorage.refToken = t.refreshToken;
  } catch { console.warn('refresh token failed'); }
}
async function logOut() {
  try {
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.accToken}` }
    });
  } finally { localStorage.clear(); location.href = 'main.html'; }
}

/* Гостевой хэдэр (без токена) */
if (!localStorage.accToken) {
  document.getElementById('notification_button')?.remove();
  const r = document.getElementById('header_right');
  if (r) r.innerHTML = `<a href="login.html"><div class="registerBtn">
      <button class="register">Zaloguj się</button></div></a>`;
}

/* toast helper */
function toast(text, err = false) {
  const c = document.getElementById('toastContainer') ||
    (() => { const d = document.createElement('div'); d.id = 'toastContainer';
      Object.assign(d.style, { position: 'fixed', right: '30px', bottom: '30px', zIndex: 9999 });
      document.body.appendChild(d); return d; })();
  const b = document.createElement('div');
  Object.assign(b.style, {
    background: err ? '#EA3943' : '#3861FB', color: '#fff',
    padding: '10px 16px', marginTop: '8px', borderRadius: '8px',
    fontSize: '14px', boxShadow: '0 2px 6px rgba(0,0,0,.2)'
  });
  b.textContent = text; c.appendChild(b); setTimeout(() => b.remove(), 4000);
}

/* ╔═ 2. DOM READY ═════════════════════════════════════════════════════╗ */
document.addEventListener('DOMContentLoaded', () => {
  footerMetrics();
  loadBanner();   loadDetails();

  initSidebar();  initGamesNav();      // Teams — вкладка по умолчанию
  document.getElementById('log-out')?.addEventListener('click', logOut);
});

/* footer timings */
function footerMetrics() {
  const s1 = document.querySelector('.footer-content span:nth-child(3)');
  const s2 = document.querySelector('.footer-content span:nth-child(4)');
  if (!s1 || !s2) return;
  window.addEventListener('load', () => setTimeout(() => {
    const t = performance.timing;
    s1.innerHTML = `Strona: <span class="blue">${Math.round(t.loadEventEnd - t.navigationStart)}ms</span>`;
    s2.innerHTML = `Szablon: <span class="blue">${Math.round(t.responseEnd - t.responseStart)}ms</span>`;
  }, 0));
}

/* ╔═ 3. BANNER & DETAILS ══════════════════════════════════════════════╗ */
async function loadBanner() {
  try {
    const url = await fetch(`${API}/competition/get-image/${COMP_ID}`).then(r => r.text());
    document.querySelector('.banner').style.background = `url(${url}) center/cover`;
    document.querySelector('.avatar img').src = url;
  } catch {}
}
let meId = null;
async function getMeId() {
  if (meId !== null) return meId;
  if (!localStorage.accToken) return null;
  try {
    const me = await fetch(`${API}/user/profile`, {
      headers: { Authorization: `Bearer ${localStorage.accToken}` }
    }).then(r => r.ok ? r.json() : null);
    meId = me?.id ?? null; return meId;
  } catch { return null; }
}
async function loadDetails() {
  const comp = await fetch(`${API}/competition/all`).then(r => r.json())
    .then(a => a.find(c => c.id === COMP_ID));
  if (!comp) return;

  /* статус + кнопка регистрации */
  const badge = document.querySelector('.active-badge');
  if (badge) {
    badge.querySelector('span').textContent = comp.status;
    badge.querySelector('div').style.backgroundColor =
      comp.status.toUpperCase() === 'ACTIVE' ? 'green' : 'gray';
  }
  const regBtn = document.querySelector('.register-btn');
  if (regBtn) regBtn.style.display = comp.status.toUpperCase() === 'ACTIVE' ? 'none' : 'block';

  /* спорт + название */
  const sport = await fetch(`${API}/sport/id/${comp.sportId}`).then(r => r.json());
  document.querySelector('.tournament-name strong').textContent = comp.name;
  document.querySelector('.tournament-name span').textContent   = sport.name;

  /* лимит участников */
  const gs   = await fetch(`${API}/game-system/${comp.gameSystemId}`).then(r => r.json());
  const maxC = gs.maxTeamSize ?? gs.playersPerTeam ?? '?';
  const curC = await fetch(`${API}/competition/league-table/${COMP_ID}`)
    .then(r => r.json()).then(a => a.length);

  const det  = document.querySelectorAll('.details div');
  det[0].querySelector('strong').textContent = sport.name;
  det[1].querySelector('strong').textContent =
    (comp.name.match(/(\d+v?s\d+)/i) || ['?'])[0].replace(/vs/i, ' v ');
  det[2].querySelector('strong').textContent = `${curC} / ${maxC}`;
  det[3].querySelector('strong').textContent =
    new Date(comp.startDate).toLocaleDateString('pl-PL');

  /* feedback input visibility */
  const fbBox = document.querySelector('.feedback-input');
  if (fbBox) {
    if (await iParticipate()) {
      fbBox.style.display = 'flex';
      const inp = fbBox.querySelector('input');
      const btn = fbBox.querySelector('button');
      btn.disabled = true;
      inp.oninput  = () => btn.disabled = !inp.value.trim();
      btn.onclick  = () => sendFeedback(inp, btn);
    } else fbBox.style.display = 'none';
  }
  loadFeedback();
}
async function iParticipate() {
  const uid = await getMeId(); if (!uid) return false;
  const myTeams = await fetch(`${API}/team/get-teams-by-userId?userId=${uid}`)
    .then(r => r.ok ? r.json() : []).then(a => a.map(t => t.id));
  const table = await fetch(`${API}/competition/league-table/${COMP_ID}`).then(r => r.json());
  return table.some(r => r.playerId === uid || myTeams.includes(r.teamId));
}

/* ╔═ 4. FEEDBACK (add / like / del‑own) ════════════════════════════════╗ */
async function sendFeedback(inp, btn) {
  const msg = inp.value.trim(); if (!msg) return;
  try {
    const r = await fetch(`${API}/feedback/create/${COMP_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.accToken}`
      },
      body: JSON.stringify({ message: msg })
    });
    if (!r.ok) throw new Error();
    toast('Wysłano'); inp.value = ''; btn.disabled = true; loadFeedback();
  } catch { toast('Błąd wysyłki', true); }
}
function commentHTML(f, u, av, mine) {
  const when = new Date(f.createdAt).toLocaleString('pl-PL',
    { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
  return `
  <div class="comment" data-id="${f.id}">
    <div class="comment-header" style="display:flex;align-items:center;gap:8px">
      <div class="avatar-comment"><img src="${av}" style="width:35px;height:35px;border-radius:50%"></div>
      <span>${u.username}</span>
      <span class="timestamp" style="margin-left:auto;color:#94a3b8">${when}</span>
      ${mine ? `<button class="del-btn" title="Usuń" style="border:none;background:none;cursor:pointer;font-size:18px">🗑️</button>` : ''}
    </div>
    <p style="margin:10px 0 0 45px">${f.message}</p>
    <div class="comment-reactions" style="position:absolute;right:10px;bottom:10px;display:flex;gap:14px">
      <span style="font-size:20px">${toneEmoji[f.tonality] || '😐'}</span>
      <button class="like-btn" style="display:flex;align-items:center;gap:4px;background:none;border:none;cursor:pointer">
        <img src="img/thumbs-up.svg" style="width:20px;height:20px"><span>${f.likes}</span>
      </button>
    </div>
  </div>`;
}
async function loadFeedback() {
  const wrap = document.querySelector('.feedback');
  wrap.querySelectorAll('.comment').forEach(x => x.remove());
  const me = await getMeId();

  const data = await fetch(`${API}/feedback/get-by-competition?competitionId=${COMP_ID}`)
    .then(r => r.ok ? r.json() : []);
  for (const f of data) {
    const user = await fetch(`${API}/user/getUser/${f.userId}`).then(r => r.json());
    const av   = await fetch(`${API}/user/avatar/${user.username}`).then(r => r.text())
      .catch(() => 'img/profile.svg');
    wrap.insertAdjacentHTML('beforeend', commentHTML(f, user, av, f.userId === me));
  }

  /* like */
  wrap.querySelectorAll('.like-btn').forEach(b => b.onclick = async e => {
    e.stopPropagation();
    const id = b.closest('.comment').dataset.id;
    try {
      await fetch(`${API}/feedback/like/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.accToken}` }
      });
      const s = b.querySelector('span'); s.textContent = +s.textContent + 1;
    } catch { toast('Błąd like', true); }
  });

  /* delete */
  wrap.querySelectorAll('.del-btn').forEach(b => b.onclick = async e => {
    e.stopPropagation();
    if (!confirm('Usunąć komentarz?')) return;
    const id = b.closest('.comment').dataset.id;
    try {
      await fetch(`${API}/feedback/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.accToken}` }
      });
      b.closest('.comment').remove(); toast('Usunięto');
    } catch { toast('Błąd kasowania', true); }
  });
}

/* ╔═ 5. PARTICIPANT HELPERS ═══════════════════════════════════════════╗ */
async function getParticipant(pid, tid) {
  try {
    if (pid) {
      const u = await fetch(`${API}/user/getUser/${pid}`).then(r => r.json());
      const img = await fetch(`${API}/user/avatar/${u.username}`).then(r => r.text());
      return { type: 'player', name: u.username, img: img || 'img/profile.svg', username: u.username };
    }
    if (tid) {
      const t = await fetch(`${API}/team/currentTeam/${tid}`).then(r => r.json());
      const img = await fetch(`${API}/team/team-logo/${tid}`).then(r => r.text());
      return { type: 'team', name: t.team.teamName, img: img || 'img/default-team-avatar.png', teamName: t.team.teamName };
    }
  } catch {}
  return { type: 'unknown', name: '—', img: 'img/default-team-avatar.png' };
}
function hrefFor(p) {
  if (p.type === 'player')
    return `open-profile.html" onclick="localStorage.setItem('searchedProfile','${p.username}')`;
  if (p.type === 'team')
    return `public-teamPage.html" onclick="localStorage.setItem('searchedTeam','${p.teamName}')`;
  return '#" onclick="return false';
}
function nameHTML(p)  { return `<a href="${hrefFor(p)}" style="color:inherit;text-decoration:none"><strong>${p.name}</strong></a>`; }
function arrowHTML(p) { return `<a href="${hrefFor(p)}"><img src="img/chevron-right.svg" style="width:18px"></a>`; }

/* ╔═ 6. TEAMS LIST ════════════════════════════════════════════════════╗ */
async function loadTeams() {
  const tbl = await fetch(`${API}/competition/league-table/${COMP_ID}`).then(r => r.json());
  const arr = await Promise.all(tbl.map(r => getParticipant(r.playerId, r.teamId)));
  arr.sort((a, b) => a.name.localeCompare(b.name, 'pl-PL'));

  const list = document.querySelector('.match-list'); list.innerHTML = '';
  arr.forEach(p => list.insertAdjacentHTML('beforeend', `
    <div class="match"><div class="team-details">
      <img src="${p.img}" style="width:35px;height:35px;border-radius:50%" class="player-avatar">
      ${nameHTML(p)}</div>${arrowHTML(p)}</div>`));
}

/* ╔═ 7. GAMES TAB ═════════════════════════════════════════════════════╗ */
const gamesNav = document.querySelector('.match-header nav');
function initGamesNav() {
  const [futBtn, presBtn, pastBtn] = gamesNav.querySelectorAll('button');
  const act = b => gamesNav.querySelectorAll('button')
    .forEach(x => x.classList.toggle('active', x === b));

  futBtn .onclick = () => { act(futBtn);  loadMatches('future');  };
  presBtn.onclick = () => { act(presBtn); loadMatches('present'); };
  pastBtn.onclick = () => { act(pastBtn); loadMatches('past');    };
}
async function loadMatches(filter = 'future') {
  const list = document.querySelector('.match-list'); list.innerHTML = '';

  const resp = await fetch(`${API}/match/competitionMatches/${COMP_ID}`);
  if (!resp.ok) { list.textContent = 'Brak meczów'; return; }
  let all = await resp.json(); if (!Array.isArray(all)) all = [];

  const now = Date.now();
  const sel = all.filter(m => {
    const ts = Date.parse(m.matchDate);
    if (filter === 'future')  return ts > now;
    if (filter === 'past')    return ts < now;
    return Math.abs(ts - now) < 3.6e6;                     /* ±1 h */
  });
  if (!sel.length) { list.textContent = 'Brak meczów'; return; }

  for (const m of sel) {
    const dt   = new Date(m.matchDate);
    const time = dt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const date = dt.toLocaleDateString('pl-PL');
    const L = await getParticipant(m.playerAId, m.teamAId);
    const R = await getParticipant(m.playerBId, m.teamBId);

    list.insertAdjacentHTML('beforeend', `
      <div class="match">
        <div><strong>${time}</strong><span> ${date}</span></div>
        <div class="team-details" style="gap:6px;align-items:center;">
          <img src="${L.img}" style="width:35px;height:35px;border-radius:50%">
          ${nameHTML(L)}
          <strong style="margin:0 8px">${m.scoreA ?? '--'} : ${m.scoreB ?? '--'}</strong>
          <img src="${R.img}" style="width:35px;height:35px;border-radius:50%">
          ${nameHTML(R)}
        </div>
        <div>${arrowHTML(L)}</div>
      </div>`);
  }
}

/* ╔═ 8. SIDEBAR (Teams / Games) ═══════════════════════════════════════╗ */
function initSidebar() {
  const [teamsBtn, gamesBtn] = document.querySelectorAll('.sidebar button');
  const h3 = document.querySelector('.match-header h3');
  const act = b => document.querySelectorAll('.sidebar button')
    .forEach(x => x.classList.toggle('active', x === b));

  /* по умолчанию ‑ Teams */
  act(teamsBtn); gamesNav.style.display = 'none'; h3.textContent = 'Teams:';

  teamsBtn.onclick = () => {
    act(teamsBtn); h3.textContent = 'Teams:'; gamesNav.style.display = 'none';   loadTeams();
  };
  gamesBtn.onclick = () => {
    act(gamesBtn); h3.textContent = 'Games:'; gamesNav.style.display = 'flex';   loadMatches('future');
  };
}

/* ─────────────────────────────── EOF ──────────────────────────────── */
