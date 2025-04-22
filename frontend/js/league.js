
/* ───────────────────────────── league.js ─────────────────────────────
   Strona ligi – baner, detale, uczestnicy, mecze, TOP, feedback,
   rejestracja (indywidualna / drużynowa) + przejścia do profili
────────────────────────────────────────────────────────────────────── */

/* ╔═ 0. KONFIG ─────────────────────────────────────────────────────── */
const API     = 'http://localhost:8765';
const COMP_ID = localStorage.getItem('searchedLeague');
if (!COMP_ID) location.href = 'main.html';

/* uniwersalny nagłówek z tokenem (jeśli istnieje) */
const AUTH_HDR = localStorage.accToken
  ? { Authorization: `Bearer ${localStorage.accToken}` }
  : {};

/* ╔═ 1. AUTH & HEADER UI ──────────────────────────────────────────── */
if (localStorage.accToken && localStorage.refToken) refreshToken();

async function refreshToken () {
  try {
    const r = await fetch(`${API}/auth/refresh-token`, {
      method : 'POST',
      headers: { Authorization: `Bearer ${localStorage.refToken}` }
    });
    if (!r.ok) throw new Error();
    const t = await r.json();
    localStorage.accToken = t.accessToken;
    localStorage.refToken = t.refreshToken;
  } catch { console.warn('token refresh failed'); }
}

async function logOut () {
  try {
    await fetch(`${API}/auth/logout`, {
      method :'POST',
      headers:{ Authorization:`Bearer ${localStorage.accToken}` }
    });
  } finally {
    localStorage.clear();
    location.href = 'main.html';
  }
}

/* gość → упрощённый хедер */
if (!localStorage.accToken) {
  document.getElementById('notification_button')?.remove();
  document.getElementById('header_right').innerHTML = `
    <a href="login.html">
      <div class="registerBtn"><button class="register">Zaloguj się</button></div>
    </a>`;
}

/* ╔═ 2. UTILITY: toast ────────────────────────────────────────────── */
function toast (txt, err = false) {
  const wrap = document.getElementById('toastContainer') ||
    (() => {
      const d = document.createElement('div'); d.id = 'toastContainer';
      Object.assign(d.style,{ position:'fixed', right:'30px', bottom:'30px', zIndex:9999 });
      document.body.appendChild(d); return d;
    })();
  const box = document.createElement('div');
  Object.assign(box.style,{
    background : err ? '#EA3943' : '#3861FB',
    color      : '#fff', padding:'10px 16px', marginTop:'8px', borderRadius:'8px',
    fontSize   : '14px', boxShadow:'0 2px 6px rgba(0,0,0,.2)'
  });
  box.textContent = txt;
  wrap.appendChild(box);
  setTimeout(() => box.remove(), 4000);
}

/* ╔═ 3. DOM READY ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  footerTimings();
  loadBanner();
  loadDetails();    // zapelnia tytul, sport, mode, count, date
  setupSidebar();   // renderuje domyslnie Top

  document.getElementById('log-out')?.addEventListener('click', logOut);
});

/* ╔═ 4. FOOTER TIMINGS ────────────────────────────────────────────── */
function footerTimings () {
  const s1 = document.querySelector('.footer-content span:nth-child(3)');
  const s2 = document.querySelector('.footer-content span:nth-child(4)');
  if (!s1||!s2) return;
  window.addEventListener('load',()=>{
    setTimeout(()=>{
      const t=performance.timing;
      s1.innerHTML=`Strona: <span class="blue">${Math.round(t.loadEventEnd-t.navigationStart)} ms</span>`;
      s2.innerHTML=`Szablon: <span class="blue">${Math.round(t.responseEnd-t.responseStart)} ms</span>`;
    },0);
  });
}

/* ╔═ 5. BANNER & DETAILS ──────────────────────────────────────────── */
async function loadBanner () {
  try {
    const url = await fetch(`${API}/competition/get-image/${COMP_ID}`, {headers:AUTH_HDR})
      .then(r=>r.ok?r.text():null);
    if (url) {
      document.querySelector('.banner img').src=url;
      document.querySelector('.avatar img').src=url;
    }
  } catch {};
}

let meId = null;

async function getMeId () {
  if (meId !== null) return meId;
  if (!localStorage.accToken) return null;
  try {
    const response = await fetch(`${API}/user/profile`, {
      headers: { Authorization: `Bearer ${localStorage.accToken}` }
    });

    if (!response.ok) {
      console.error('Ошибка при получении профиля:', response.statusText);
      return null;
    }

    const me = await response.json();
    meId = me?.id ?? null;
    return meId;

  } catch (err) {
    console.error('Ошибка запроса:', err);
    return null;
  }
}


async function loadDetails () {
  // competition
  const comp = await fetch(`${API}/competition/all`,{headers:AUTH_HDR})
    .then(r=>r.json()).then(a=>a.find(c=>c.id===COMP_ID));
  if (!comp) return;

  // status + button
  const bs = document.querySelector('.active-badge span');
  const bd = document.querySelector('.active-badge div');
  if(bs) bs.textContent=comp.status;
  if(bd) bd.style.backgroundColor = comp.status.toUpperCase()==='ACTIVE'?'green':'gray';

  // registration onclick
  const regBtn = document.querySelector('.register-btn');
  if(regBtn) {
    regBtn.style.display = comp.status.toUpperCase()==='ACTIVE'?'none':'block';
    regBtn.onclick = ()=> openRegistration(comp);
  }

  // sport
  const sport = await fetch(`${API}/sport/id/${comp.sportId}`,{headers:AUTH_HDR}).then(r=>r.json());
  const tnSpan = document.querySelector('.tournament-name span');
  if(tnSpan) tnSpan.textContent=sport.name;

  // playersPerSide
  let playersPerSide='?';
  try{
    const gs = await fetch(`${API}/game-system/${comp.gameSystemId}`,{headers:localStorage.getItem('accToken')})
      .then(r=>r.ok?r.json():{});
    playersPerSide=gs.maxTeamSize??gs.playersPerTeam??'?';
  }catch{}

  // current count
  const current = await fetch(`${API}/competition/league-table/${COMP_ID}`,{headers:AUTH_HDR})
    .then(r=>r.json()).then(a=>a.length);

  // insert into DOM
  const setTxt = (sel,v)=>{ const el=document.querySelector(sel); if(el) el.textContent=v; };
  setTxt('.tournament-name strong', comp.name);
  const modeStr = (comp.name.match(/(\d+v?s\d+)/i)||['?'])[0].replace(/vs/i,' v ');
  const dateStr = new Date(comp.startDate).toLocaleDateString('pl-PL');
  setTxt('[data-field="sport"]', sport.name);
  setTxt('[data-field="mode"]', modeStr);
  setTxt('[data-field="count"]', `${current} / ${playersPerSide}`);
  setTxt('[data-field="date"]', dateStr);

  // feedback visibility …
  const fb=document.querySelector('.feedback-input');
  if(fb){ if(await userParticipates()){ fb.style.display='flex';
    const inp=fb.querySelector('input'), btn=fb.querySelector('button'); btn.disabled=true;
    inp.oninput=()=>btn.disabled=!inp.value.trim(); btn.onclick=()=>sendFeedback(inp,btn);
  } else fb.style.display='none'; }

  loadFeedbackList();
}

/* ╔═ 6. REGISTRATION ──────────────────────────────────────────────── */
async function openRegistration(comp) {
  // czy indywidualna?
  const isInd = comp.isIndividual===true;
  if(isInd) {
    if(!confirm('Czy na pewno chcesz dołączyć do tej ligi?')) return;
    // POST participation?competitionId=
    try {
      const url = new URL(`${API}/competition/participation`);
      url.searchParams.append('competitionId', COMP_ID);
      const res = await fetch(url, { method:'POST', headers: AUTH_HDR });
      const json = await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(json.message||'Błąd rejestracji');
      toast('Zarejestrowano pomyślnie!');
    } catch(e) {
      toast(e.message, true);
    }
  } else {
    // flow drużynowy z promptami (jak wcześniej)
    const me = await getMeId();
    console.log(me)
    const teams = await fetch(`${API}/team/managed?id=${me}`,{headers:AUTH_HDR})
      .then(r=>r.ok?r.json():[]);
    if(!teams.length) return toast('Nie masz drużyn do rejestracji', true);
    const tn = prompt('Wpisz nazwę drużyny:\n'+teams.map(t=>t.teamName).join('\n'));
    const team = teams.find(t=>t.teamName===tn);
    if(!team) return;
    const info = await fetch(`${API}/team/currentTeam/${encodeURIComponent(team.teamName)}`,{headers:AUTH_HDR})
      .then(r=>r.ok?r.json():{});
    const members = info.members||[];
    const ids = prompt('Podaj ID graczy oddzielone spacją:\n'+
      members.map(m=>m.userId).join(' '))
      .split(/\s+/).map(x=>+x).filter(Boolean);
    try {
      const url = new URL(`${API}/competition/participation`);
      url.searchParams.append('competitionId',COMP_ID);
      url.searchParams.append('teamId',team.id);
      ids.forEach(i=>url.searchParams.append('selectedPlayersIds',i));
      const res = await fetch(url,{method:'POST',headers:AUTH_HDR});
      const json=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(json.message||'Błąd rejestracji');
      toast('Drużyna zarejestrowana!');
    } catch(e) { toast(e.message,true); }
  }
}

/* ╔═ 7. FEEDBACK (send / list / like / delete) ────────────────────── */
async function sendFeedback (inp, btn) {
  const txt = inp.value.trim();  if (!txt) return;
  try {
    const r = await fetch(`${API}/feedback/create/${COMP_ID}`, {
      method :'POST',
      headers:{ 'Content-Type':'application/json',  'Authorization': `Bearer ${localStorage.getItem('accToken')}`},
      body   : JSON.stringify({ message: txt })
    });
    const res = await r.json().catch(()=>({message:'OK'}));
    if (!r.ok) throw new Error(res.message);
    toast('Wiadomość wysłana');
    inp.value = '';  btn.disabled = true;  loadFeedbackList();
  } catch (e) { toast(e.message || 'Błąd wysyłki', true); }
}

async function loadFeedbackList () {
  const wrap = document.querySelector('.feedback');
  if (!wrap) return;
  wrap.querySelectorAll('.comment').forEach(n => n.remove());

  const myId = await getMeId();
  const rows = await fetch(`${API}/feedback/get-by-competition?competitionId=${COMP_ID}`, {headers:AUTH_HDR})
    .then(r => r.ok ? r.json() : []);

  const toneEmoji = {
    'very positive':'😍', positive:'😊', neutral:'😐',
    negative:'😕',      'very negative':'😡'
  };

  for (const row of rows) {
    const u  = await fetch(`${API}/user/getUser/${row.userId}`, {headers:AUTH_HDR}).then(r=>r.json());
    const av = await fetch(`${API}/user/avatar/${u.username}`, {headers:AUTH_HDR})
      .then(r=>r.text()).catch(()=>'img/profile.svg');
    const when = new Date(row.createdAt).toLocaleString('pl-PL',
      {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short'});

    const card = document.createElement('div');
    card.className = 'comment';
    card.dataset.id = row.id;
    card.innerHTML = `
      <div class="comment-header" style="display:flex;align-items:center;gap:8px">
        <div class="avatar-comment"><img src="${av}" style="width:35px;height:35px;border-radius:50%"></div>
        <span>${u.username}</span>
        <span class="timestamp" style="margin-left:auto;color:#94a3b8">${when}</span>
        ${myId === row.userId
      ? '<button class="fb-del" style="background:none;border:none;font-size:18px;cursor:pointer">🗑️</button>'
      : ''}
      </div>
      <p style="margin:10px 0 0 45px">${row.message}</p>
      <div class="comment-reactions" style="position:absolute;right:10px;bottom:10px;display:flex;gap:14px">
        <span style="font-size:20px">${toneEmoji[row.tonality?.toLowerCase()] || '😐'}</span>
        <button class="fb-like" style="display:flex;align-items:center;gap:4px;background:none;border:none;cursor:pointer">
          <img src="img/thumbs-up.svg" style="width:20px;height:20px"><span>${row.likes}</span>
        </button>
      </div>`;
    wrap.appendChild(card);
  }

  /* like */
  wrap.querySelectorAll('.fb-like').forEach(btn =>
    btn.onclick = async e => {
      e.stopPropagation();
      const id = btn.closest('.comment').dataset.id;
      try {
        await fetch(`${API}/feedback/like/${id}`, {method:'PUT', headers:AUTH_HDR});
        const s = btn.querySelector('span');  s.textContent = +s.textContent + 1;
      } catch { toast('Błąd like', true); }
    });

  /* delete (owner) */
  wrap.querySelectorAll('.fb-del').forEach(btn =>
    btn.onclick = async e => {
      e.stopPropagation();
      if (!confirm('Usunąć komentarz?')) return;
      const id = btn.closest('.comment').dataset.id;
      try {
        await fetch(`${API}/feedback/delete/${id}`, {method:'DELETE', headers:AUTH_HDR});
        btn.closest('.comment').remove();
        toast('Usunięto komentarz');
      } catch { toast('Błąd kasowania', true); }
    });
}

/* ╔═ 8. PARTICIPANT HELPERS ───────────────────────────────────────── */

async function fetchParticipant (playerId, teamId) {

  /* indywidualny zawodnik */
  if (playerId) {
    try {
      const u   = await fetch(`${API}/user/getUser/${playerId}`, {headers:AUTH_HDR}).then(r=>r.json());
      const img = await fetch(`${API}/user/avatar/${u.username}`, {headers:AUTH_HDR})
        .then(r=>r.text()).catch(()=> 'img/profile.svg');
      return {type:'player', name:u.username, img, username:u.username};
    } catch {}
  }

  /* drużyna */
  if (teamId) {
    try {
      /* meta po ID (auth, linia≈298) */
      const meta = await fetch(`${API}/team/current/${teamId}`, {headers:AUTH_HDR})
        .then(r=>r.ok ? r.json() : null);
      const teamName = meta?.teamName || teamId;

      /* info po nazwie (требование бекенда) */
      const info = await fetch(`${API}/team/currentTeam/${encodeURIComponent(teamName)}`,
        {headers:AUTH_HDR})
        .then(r=>r.ok ? r.json() : null);

      const img = info?.team?.teamImage ||
        await fetch(`${API}/team/team-logo/${teamId}`, {headers:AUTH_HDR})
          .then(r=>r.ok ? r.text() : 'img/default-team-avatar.png')
          .catch(()=> 'img/default-team-avatar.png');

      return {type:'team', name:teamName, img, teamName};
    } catch {}
  }

  /* fallback */
  return {type:'unknown', name:'—', img:'img/default-team-avatar.png'};
}

function linkToProfile (p) {
  if (p.type === 'player')
    return `open-profile.html" onclick="localStorage.setItem('searchedProfile','${p.username}')`;
  if (p.type === 'team')
    return `public-teamPage.html" onclick="localStorage.setItem('searchedTeam','${p.teamName}')`;
  return '#" onclick="return false';
}

const nameHTML  = p => `<a href="${linkToProfile(p)}" style="color:inherit;text-decoration:none"><strong>${p.name}</strong></a>`;
const arrowHTML = p => `<a href="${linkToProfile(p)}"><img src="img/chevron-right.svg" style="width:18px;height:18px"></a>`;

/* ╔═ 9. TEAMS & TOP ───────────────────────────────────────────────── */
async function loadTeams () {
  const tbl  = await fetch(`${API}/competition/league-table/${COMP_ID}`, {headers:AUTH_HDR}).then(r=>r.json());
  const arr  = await Promise.all(tbl.map(r => fetchParticipant(r.playerId, r.teamId)));
  arr.sort((a,b) => a.name.localeCompare(b.name, 'pl-PL'));

  const list = document.querySelector('.match-list');  list.innerHTML = '';
  arr.forEach(p => {
    list.insertAdjacentHTML('beforeend', `
      <div class="match">
        <div class="team-details">
          <img src="${p.img}" style="width:35px;height:35px;border-radius:50%">${nameHTML(p)}
        </div>${arrowHTML(p)}
      </div>`);
  });
}

async function loadTop () {
  const tbl = await fetch(`${API}/competition/league-table/${COMP_ID}`, {headers:AUTH_HDR}).then(r=>r.json());
  tbl.sort((a,b) => b.wins - a.wins);

  const list = document.querySelector('.match-list');  list.innerHTML = '';
  for (const row of tbl) {
    const p = await fetchParticipant(row.playerId, row.teamId);
    list.insertAdjacentHTML('beforeend', `
      <div class="match">
        <div class="team-details">
          <img src="${p.img}" style="width:35px;height:35px;border-radius:50%">${nameHTML(p)}
        </div>
        <div class="team-place"><span>Miejsce:</span>
          <div class="badge"><strong>${row.wins}</strong><div></div></div>
        </div>
        <div class="team-victories"><span>Zwycięstwa:</span><strong>${row.wins}</strong></div>
        ${arrowHTML(p)}
      </div>`);
  }
}

/* ╔═ 10. MATCHES (roundy) ─────────────────────────────────────────── */
let totalR = 1, curR = 1;

async function setupMatches () {
  const tbl = await fetch(`${API}/competition/league-table/${COMP_ID}`, {headers:AUTH_HDR}).then(r=>r.json());
  totalR = tbl.length > 1 ? tbl.length - 1 : 1;
  curR   = 1;
  renderRoundCtrls();
  renderRound();
}

function renderRoundCtrls () {
  document.querySelector('.round-controls')?.remove();
  const head = document.querySelector('.match-header');
  const box  = document.createElement('div');
  box.className = 'round-controls';
  Object.assign(box.style, {marginLeft:'auto', display:'flex', gap:'8px', alignItems:'center'});

  const mk = txt => { const b = document.createElement('button'); b.textContent = txt; return b; };
  const prev = mk('‹'), next = mk('›'), span = document.createElement('span');
  span.className = 'round-indicator';

  const upd = () => {
    span.textContent = `Tura ${curR}/${totalR}`;
    prev.disabled = curR === 1;
    next.disabled = curR === totalR;
  };

  prev.onclick = () => { if (curR > 1) { curR--; upd(); renderRound(); } };
  next.onclick = () => { if (curR < totalR) { curR++; upd(); renderRound(); } };

  upd();
  box.append(prev, span, next);
  head.appendChild(box);
}

async function renderRound () {
  const list = document.querySelector('.match-list');  list.innerHTML = '';
  const r    = await fetch(`${API}/match/tourMatches/${COMP_ID}?leagueTourNumber=${curR}`, {headers:AUTH_HDR});
  if (!r.ok) { list.textContent = 'Brak meczów'; return; }
  const arr  = await r.json();

  for (const m of arr) {
    const dt = new Date(m.matchDate);
    const L  = await fetchParticipant(m.playerAId, m.teamAId);
    const R  = await fetchParticipant(m.playerBId, m.teamBId);

    list.insertAdjacentHTML('beforeend', `
      <div class="match">
        <div>
          <strong>${dt.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}</strong>
          <span> ${dt.toLocaleDateString('pl-PL')}</span>
        </div>
        <div class="team-details" style="gap:6px;align-items:center;">
          <img src="${L.img}" style="width:35px;height:35px;border-radius:50%">${nameHTML(L)}
          <strong style="margin:0 8px">${m.scoreA ?? '--'}:${m.scoreB ?? '--'}</strong>
          <img src="${R.img}" style="width:35px;height:35px;border-radius:50%">${nameHTML(R)}
        </div>
        <div>${arrowHTML(L)}</div>
      </div>`);
  }
}

/* ╔═ 11. SIDEBAR ──────────────────────────────────────────────────── */
function setupSidebar () {
  const [btnTeams, btnGames, btnTop] = document.querySelectorAll('.sidebar button');
  const h   = document.querySelector('.match-header h3');
  const act = b => document.querySelectorAll('.sidebar button')
    .forEach(x => x.classList.toggle('active', x === b));

  /* domyślnie — TOP */
  act(btnTop);
  h.textContent = 'Top:';
  loadTop();

  btnTeams.onclick = () => {
    act(btnTeams);
    h.textContent = 'Uczestnicy:';
    document.querySelector('.round-controls')?.remove();
    loadTeams();
  };

  btnGames.onclick = () => {
    act(btnGames);
    h.textContent = 'Mecze:';
    setupMatches();
  };

  btnTop.onclick = () => {
    act(btnTop);
    h.textContent = 'Top:';
    document.querySelector('.round-controls')?.remove();
    loadTop();
  };
}

/* ╔═ 12. PARTICIPATION CHECK ──────────────────────────────────────── */
async function userParticipates () {
  const uid = await getMeId();  if (!uid) return false;
  const myTeams = await fetch(`${API}/team/get-teams-by-userId?userId=${uid}`, {headers:AUTH_HDR})
    .then(r=>r.ok ? r.json() : [])
    .then(a => a.map(t => t.id));
  const tbl = await fetch(`${API}/competition/league-table/${COMP_ID}`, {headers:AUTH_HDR})
    .then(r=>r.json());
  return tbl.some(r => r.playerId === uid || myTeams.includes(r.teamId));
}
// 1) получаем референсы
const teamModal     = document.getElementById('teamModal');
const playerModal   = document.getElementById('playerModal');
const teamListEl    = document.getElementById('teamList');
const playerListEl  = document.getElementById('playerList');
const teamNextBtn   = document.getElementById('teamNextBtn');
const playerConfBtn = document.getElementById('playerConfirmBtn');

let _selectedTeam  = null;
let _selectedPlayers = [];

// 2) закрыть любые модалки
function closeAllModals() {
  teamModal.classList.add('hidden');
  playerModal.classList.add('hidden');
  teamListEl.innerHTML = '';
  playerListEl.innerHTML = '';
  teamNextBtn.disabled = true;
  playerConfBtn.disabled = true;
  _selectedTeam = null;
  _selectedPlayers = [];
}

// 3) открытие регистрации (из openRegistration)
async function openRegistration(comp) {
  const isInd = comp.isIndividual === true;
  if (isInd) {
    // сразу POST + toast
    if (!confirm('Czy na pewno chcesz dołączyć do tej ligi?')) return;
    const url = new URL(`${API}/competition/participation`);
    url.searchParams.append('competitionId', COMP_ID);
    try {
      const res = await fetch(url, {method:'POST', headers:AUTH_HDR});
      const json = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(json.message||'Błąd rejestracji');
      toast('Zarejestrowano pomyślnie!');
    } catch (e) {
      toast(e.message, true);
    }
  } else {
    // командная – показываем первую модалку
    await renderTeamList();
    teamModal.classList.remove('hidden');
  }
}

// 4) рендерим список команд
async function renderTeamList() {
  const me = await getMeId();
  const teams = await fetch(`${API}/team/managed?id=${me}`, { headers: AUTH_HDR })
    .then(r => r.ok ? r.json() : []);

  teamListEl.innerHTML = '';
  teams.forEach(async t => {
    const img = await fetch(`${API}/team/team-logo/${t.id}`, { headers: AUTH_HDR })
      .then(r => r.ok ? r.text() : 'img/default-team-avatar.png')
      .catch(() => 'img/default-team-avatar.png');

    const div = document.createElement('div');
    div.className = 'reg-modal__item';
    div.innerHTML = `
      <div class="reg-modal__item-left">
        <div class="reg-modal__avatar">
          <img src="${img}" style="width:30px;height:30px;border-radius:50%">
        </div>
        <span>${t.teamName}</span>
      </div>
      <input type="checkbox" value="${t.teamName}" />
    `;
    teamListEl.appendChild(div);

    const chk = div.querySelector('input');
    chk.onchange = () => {
      teamListEl.querySelectorAll('input').forEach(i => { if (i !== chk) i.checked = false; });
      _selectedTeam = chk.checked ? t : null;
      teamNextBtn.disabled = !_selectedTeam;
    };
  });
}


// 5) клик «Dalej»
async function onTeamNext() {
  if (!_selectedTeam) return;
  teamModal.classList.add('hidden');
  await renderPlayerList(_selectedTeam);
  playerModal.classList.remove('hidden');
}

// 6) рендерим список игроков выбранной команды
async function renderPlayerList(team) {
  const info = await fetch(`${API}/team/currentTeam/${encodeURIComponent(team.teamName)}`, { headers: AUTH_HDR })
    .then(r => r.ok ? r.json() : { members: [] });

  playerListEl.innerHTML = '';

  info.members.forEach(async m => {
    const user = await fetch(`${API}/user/getUser/${m.userId}`, { headers: AUTH_HDR })
      .then(r => r.ok ? r.json() : { username: `#${m.userId}` });

    const avatar = await fetch(`${API}/user/avatar/${user.username}`, { headers: AUTH_HDR })
      .then(r => r.ok ? r.text() : 'img/profile.svg')
      .catch(() => 'img/profile.svg');

    const div = document.createElement('div');
    div.className = 'reg-modal__item';
    div.innerHTML = `
      <div class="reg-modal__item-left">
        <div class="reg-modal__avatar">
          <img src="${avatar}" style="width:30px;height:30px;border-radius:50%">
        </div>
        <span>${user.username}</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <time style="font-size:12px;color:#666">${new Date(m.createdAt).toLocaleDateString('pl-PL')}</time>
        <input type="checkbox" value="${m.userId}" />
      </div>
    `;
    playerListEl.appendChild(div);

    div.querySelector('input').onchange = () => {
      _selectedPlayers = Array.from(playerListEl.querySelectorAll('input:checked'))
        .map(i => i.value);
      playerConfBtn.disabled = _selectedPlayers.length === 0;
    };
  });
}


// 7) клик «Zatwierdź»
async function onPlayersConfirm() {
  if (!_selectedTeam || !_selectedPlayers.length) return;

  const url = new URL(`${API}/competition/participation`);
  url.searchParams.append('competitionId', COMP_ID);
  url.searchParams.append('teamId', _selectedTeam.id);
  _selectedPlayers.forEach(id => url.searchParams.append('selectedPlayersIds', id));
  try {
    const res = await fetch(url, {method:'POST',  headers: { Authorization: `Bearer ${localStorage.getItem('accToken')}` }});
    const json = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(json.message||'Błąd rejestracji');
    toast('Drużyna zarejestrowana!');
  } catch (e) {
    toast(e.message, true);
  } finally {
    closeAllModals();
  }
}

/* ─────────────────────────────── EOF ─────────────────────────────── */
