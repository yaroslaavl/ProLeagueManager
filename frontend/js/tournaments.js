// tournaments-enhanced.js
// Расширенный функционал для публичной страницы турнира (single-elimination/cup)

const API     = 'http://localhost:8765';
const COMP_ID = localStorage.getItem('searchedTournament');
if (!COMP_ID) location.href = 'main.html';

let meId   = null;
let stages = [];

// helper для заголовков с токеном
function authHeaders() {
  const token = localStorage.getItem('accToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ==================== AUTH & HEADER ====================
if (localStorage.getItem('accToken') && localStorage.getItem('refToken')) refreshToken();
async function refreshToken() {
  try {
    const resp = await fetch(`${API}/auth/refresh-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('refToken')}` }
    });
    if (!resp.ok) throw new Error();
    const data = await resp.json();
    localStorage.setItem('accToken', data.accessToken);
    localStorage.setItem('refToken', data.refreshToken);
  } catch {
    console.warn('refresh token failed');
  }
}
async function logOut() {
  try {
    await fetch(`${API}/auth/logout`, { method:'POST', headers: authHeaders() });
  } finally {
    localStorage.clear();
    location.href = 'main.html';
  }
}
if (!localStorage.getItem('accToken')) {
  document.getElementById('notification_button')?.remove();
  const hdr = document.getElementById('header_right');
  if (hdr) hdr.innerHTML = `
    <a href="login.html">
      <div class="registerBtn"><button class="register">Zaloguj się</button></div>
    </a>`;
}

// ==================== DOM Ready ====================
document.addEventListener('DOMContentLoaded', async () => {
  await fetchStages();
  footerMetrics();
  loadBanner();
  loadDetails();
  initSidebar();

  // кнопка закрытия модалки
  const modalClose = document.getElementById('bracketModalClose');
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      document.getElementById('bracketModal')?.classList.add('hidden');
    });
  }
});

// ==================== FETCH STAGES ====================
async function fetchStages() {
  stages = await fetch(
    `${API}/competition/stages?competitionId=${COMP_ID}`,
    { headers: authHeaders() }
  )
    .then(r => r.ok ? r.json() : []);
}

// ==================== FOOTER ====================
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

// ==================== BANNER & DETAILS ====================
async function loadBanner() {
  try {
    const url = await fetch(`${API}/competition/get-image/${COMP_ID}`, {
      headers: authHeaders()
    }).then(r => r.ok ? r.text() : null);
    if (url) {
      document.querySelector('.banner').style.background = `url(${url}) center/cover`;
      document.querySelector('.avatar img').src = url;
    }
  } catch {}
}

async function getMeId() {
  if (meId !== null) return meId;
  if (!localStorage.getItem('accToken')) return null;
  try {
    const me = await fetch(`${API}/user/profile`, {
      headers: authHeaders()
    }).then(r => r.ok ? r.json() : null);
    meId = me?.id ?? null;
    return meId;
  } catch {
    return null;
  }
}

async function loadDetails() {
  const comp = await fetch(`${API}/competition/all`, {
    headers: authHeaders()
  })
    .then(r => r.ok ? r.json() : [])
    .then(a => a.find(c => c.id === COMP_ID));
  if (!comp) return;

  // статус + кнопка регистрации
  const badge = document.querySelector('.active-badge');
  if (badge) {
    badge.querySelector('span').textContent = comp.status;
    badge.querySelector('div').style.backgroundColor =
      comp.status.toUpperCase() === 'ACTIVE' ? 'green' : 'gray';
  }
  const regBtn = document.querySelector('.register-btn');
  if (regBtn) {
    regBtn.style.display = comp.status.toUpperCase() === 'ACTIVE' ? 'none' : 'block';
    regBtn.onclick = () => openRegistration(comp);
  }

  // sport + название
  const sport = await fetch(`${API}/sport/id/${comp.sportId}`, {
    headers: authHeaders()
  }).then(r => r.ok ? r.json() : { name: '' });
  document.querySelector('.tournament-name strong').textContent = comp.name;
  document.querySelector('.tournament-name span').textContent   = sport.name;

  // лимит и текущие участники
  const gs   = await fetch(`${API}/game-system/get/${comp.gameSystemId}`, {
    headers: authHeaders()
  }).then(r => r.ok ? r.json() : {});
  const maxC = gs.maxTeamSize ?? gs.playersPerTeam ?? '?';
  const playersArr = await fetch(`${API}/competition/players/${COMP_ID}`, {
    headers: authHeaders()
  }).then(r => r.ok ? r.json() : []);
  const curC = Array.isArray(playersArr) ? playersArr.length : 0;

  const det = document.querySelectorAll('.details div');
  det[0].querySelector('strong').textContent = sport.name;
  det[1].querySelector('strong').textContent =
    (comp.name.match(/(\d+v?s\d+)/i) || ['?'])[0].replace(/vs/i,' v ');
  det[2].querySelector('strong').textContent = `${curC} / ${maxC}`;
  det[3].querySelector('strong').textContent =
    new Date(comp.startDate).toLocaleDateString('pl-PL');

  // feedback
  const fbBox = document.querySelector('.feedback-input');
  if (fbBox) {
    if (await userParticipates()) {
      fbBox.style.display = 'flex';
      const inp = fbBox.querySelector('input'),
        btn = fbBox.querySelector('button');
      btn.disabled = true;
      inp.oninput = () => btn.disabled = !inp.value.trim();
      btn.onclick  = () => sendFeedback(inp, btn);
    } else {
      fbBox.style.display = 'none';
    }
  }
  loadFeedback();
}

// ==================== FEEDBACK ====================
function toast(txt, err=false) {
  const c = document.getElementById('toastContainer')||(() => {
    const d=document.createElement('div'); d.id='toastContainer';
    Object.assign(d.style,{
      position:'fixed', right:'30px', bottom:'30px', zIndex:9999
    });
    document.body.appendChild(d);
    return d;
  })();
  const b=document.createElement('div');
  Object.assign(b.style,{
    background: err?'#EA3943':'#3861FB',
    color:'#fff', padding:'10px 16px', marginTop:'8px', borderRadius:'8px',
    fontSize:'14px', boxShadow:'0 2px 6px rgba(0,0,0,.2)'
  });
  b.textContent=txt; c.appendChild(b);
  setTimeout(() => b.remove(), 4000);
}

async function sendFeedback(inp,btn){
  const msg = inp.value.trim();
  if(!msg) return;
  const res = await fetch(`${API}/feedback/create/${COMP_ID}`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', ...authHeaders() },
    body: JSON.stringify({ message: msg })
  });
  if(!res.ok){ toast('Błąd wysyłki', true); return; }
  toast('Wysłано');
  inp.value=''; btn.disabled=true;
  loadFeedback();
}

async function loadFeedback(){
  const wrap = document.querySelector('.feedback');
  wrap.querySelectorAll('.comment').forEach(x => x.remove());
  const me   = await getMeId();
  const data = await fetch(
    `${API}/feedback/get-by-competition?competitionId=${COMP_ID}`,
    { headers: authHeaders() }
  ).then(r => r.ok ? r.json() : []);
  const emo  = {
    'very positive':'😍','positive':'😊','neutral':'😐',
    'negative':'😕','very negative':'😡'
  };

  for (const f of data) {
    const u  = await fetch(`${API}/user/getUser/${f.userId}`, {
      headers: authHeaders()
    }).then(r => r.ok ? r.json() : { username:'' });
    const av = await fetch(`${API}/user/avatar/${u.username}`, {
      headers: authHeaders()
    }).then(r => r.ok ? r.text() : 'img/profile.svg')
      .catch(() => 'img/profile.svg');
    const when = new Date(f.createdAt).toLocaleString('pl-PL',{
      hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short'
    });

    wrap.insertAdjacentHTML('beforeend', `
      <div class="comment" data-id="${f.id}">
        <div class="comment-header" style="display:flex;align-items:center;gap:8px">
          <div class="avatar-comment">
            <img src="${av}" style="width:24px;height:24px;border-radius:50%">
          </div>
          <span>${u.username}</span>
          <span class="timestamp" style="margin-left:auto;color:#94a3b8">${when}</span>
          ${f.userId === me
      ? `<button class="del-btn" style="border:none;background:none;cursor:pointer;font-size:18px">🗑️</button>`
      : ''
    }
        </div>
        <p style="margin:10px 0 0 45px">${f.message}</p>
        <div class="comment-reactions" style="position:absolute;right:10px;bottom:10px;display:flex;gap:14px">
          <span style="font-size:20px">${emo[f.tonality]||'😐'}</span>
          <button class="like-btn" style="display:flex;align-items:center;gap:4px;background:none;border:none;cursor:pointer">
            <img src="img/thumbs-up.svg" style="width:20px;height:20px"><span>${f.likes}</span>
          </button>
        </div>
      </div>`);
  }

  wrap.querySelectorAll('.like-btn').forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      const id = btn.closest('.comment').dataset.id;
      const r  = await fetch(`${API}/feedback/like/${id}`, {
        method:'PUT', headers:authHeaders()
      });
      if (r.ok) {
        const span = btn.querySelector('span');
        span.textContent = +span.textContent + 1;
      } else {
        toast('Błąд', true);
      }
    };
  });

  wrap.querySelectorAll('.del-btn').forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      if (!confirm('Usunąć комментарий?')) return;
      const id = btn.closest('.comment').dataset.id;
      const r  = await fetch(`${API}/feedback/delete/${id}`, {
        method:'DELETE', headers:authHeaders()
      });
      if (r.ok) {
        btn.closest('.comment').remove();
        toast('Удалено');
      } else {
        toast('Ошибка', true);
      }
    };
  });
}

// ==================== PARTICIPANT HELPERS ====================
async function getParticipant(pid,tid){
  if(pid){
    const u   = await fetch(`${API}/user/getUser/${pid}`, {
      headers: authHeaders()
    }).then(r => r.ok ? r.json() : { username:'' });
    const img = await fetch(`${API}/user/avatar/${u.username}`, {
      headers: authHeaders()
    }).then(r => r.ok ? r.text() : 'img/profile.svg')
      .catch(() => 'img/profile.svg');
    return { type:'player', name:u.username, img, username:u.username };
  }
  if(tid){
    const t   = await fetch(
      `${API}/team/currentTeam/${encodeURIComponent(tid)}`,
      { headers: authHeaders() }
    ).then(r => r.ok ? r.json() : { team:{ teamName:'' }});
    const img = await fetch(`${API}/team/team-logo/${tid}`, {
      headers: authHeaders()
    }).then(r => r.ok ? r.text() : 'img/default-team-avatar.png')
      .catch(() => 'img/default-team-avatar.png');
    return { type:'team', name:t.team.teamName, img, teamName:t.team.teamName };
  }
  return { type:'unknown', name:'—', img:'img/default-team-avatar.png' };
}

function hrefFor(p){
  if (p.type==='player')
    return `open-profile.html" onclick="localStorage.setItem('searchedProfile','${p.username}')`;
  if (p.type==='team')
    return `public-teamPage.html" onclick="localStorage.setItem('searchedTeam','${p.teamName}')`;
  return '#" onclick="return false';
}
const nameHTML  = p => `<a href="${hrefFor(p)}" style="color:inherit;text-decoration:none"><strong>${p.name}</strong></a>`;
const arrowHTML = p => `<a href="${hrefFor(p)}"><img src="img/chevron-right.svg" style="width:18px"></a>`;

// ==================== TEAMS ====================
async function loadTeams(){
  const ids  = await fetch(`${API}/competition/players/${COMP_ID}`, {
    headers: authHeaders()
  }).then(r => r.ok ? r.json() : []);
  const list = document.querySelector('.match-list');
  list.innerHTML = '';
  for (const id of ids) {
    const p = await getParticipant(id, null);
    list.insertAdjacentHTML('beforeend', `
      <div class="match">
        <div class="team-details">
          <img src="${p.img}" style="width:24px;height:24px;border-radius:50%">
          ${nameHTML(p)}
        </div>
        ${arrowHTML(p)}
      </div>`);
  }
}

// ==================== GAMES NAV ====================
function initGamesNav(){
  const gamesNav = document.querySelector('.match-header nav');
  if (!gamesNav) return;
  gamesNav.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      gamesNav.querySelectorAll('button')
        .forEach(b => b.classList.toggle('active', b===btn));
      loadMatches(btn.textContent.trim().toLowerCase());
    };
  });
}

// ==================== LOAD MATCHES ====================
async function loadMatches(filter){
  const list = document.querySelector('.match-list');
  list.innerHTML = '';

  const url = new URL(`${API}/match/dynamic-all/${COMP_ID}`);
  stages.forEach(s => url.searchParams.append('stageId', s.id));
  const map = {
    future: ['SCHEDULED','WAITING_FOR_OPPONENT'],
    present: ['IN_PROGRESS'],
    past: ['FINISHED','CANCELLED','BYE','AUTO_WIN']
  };
  map[filter].forEach(st => url.searchParams.append('matchStatuses', st));

  const resp = await fetch(url, { headers: authHeaders() });
  if (!resp.ok) {
    list.textContent = 'Brak meczów'; return;
  }
  const arr = await resp.json();
  if (!arr.length) {
    list.textContent = 'Brak meczów'; return;
  }

  for (const m of arr) {
    if (!m.matchDate) continue;
    const dt = new Date(m.matchDate);
    if (dt.getFullYear() < 2000) continue;
    const L = await getParticipant(m.playerAId, m.teamAId);
    const R = await getParticipant(m.playerBId, m.teamBId);
    if (L.type==='unknown' && R.type==='unknown') continue;

    const time      = dt.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'});
    const date      = dt.toLocaleDateString('pl-PL');
    const stageObj  = stages.find(s => s.id === m.stageId);
    const stageName = stageObj ? stageObj.stageName : '';

    list.insertAdjacentHTML('beforeend', `
      <div class="match">
        <div class="match-time">
          <strong>${time}</strong><span> ${date}</span>
        </div>
        <div class="team-details">
          <strong>${L.name}</strong>
          <img src="${L.img}" alt="">
          <strong> ${m.scoreA ?? '--'} : ${m.scoreB ?? '--'} </strong>
          <img src="${R.img}" alt="">
          <strong>${R.name}</strong>
        </div>
        <div class="match-stage"><strong>${stageName}</strong></div>
      </div>`);
  }
}

// ==================== BRACKET (modal) ====================
async function initBracket() {
  const $bracket = $('#modal-bracket');
  const data = await fetch(`${API}/match/grouped-by-stage/${COMP_ID}`, { headers: authHeaders() })
    .then(r => r.ok ? r.json() : []);
  if (!data.length) {
    $bracket.text('Brak danych dla siatki');
    return;
  }
  data.sort((a,b) => a.stageOrder - b.stageOrder);
  const firstRound = data[0].matchList;
  const teams = await Promise.all(
    firstRound.map(async m => {
      const L = await getParticipant(m.playerAId, m.teamAId);
      const R = await getParticipant(m.playerBId, m.teamBId);
      return [ L.name, R.name ];
    })
  );
  const results = data.map(stage =>
    stage.matchList.map(m =>
      m.matchStatus === 'FINISHED'
        ? [ m.scoreA ?? 0, m.scoreB ?? 0 ]
        : [ null, null ]
    )
  );
  $bracket.empty().bracket({
    init: { teams, results },
    skipConsolationRound: true
  });
}


// ==================== TOP ====================
async function loadTop(){
  const tbl = await fetch(
    `${API}/competition/league-table/${COMP_ID}`,
    { headers: authHeaders() }
  ).then(r => r.ok ? r.json() : []);
  tbl.sort((a,b) => b.wins - a.wins);

  const list = document.querySelector('.match-list');
  list.innerHTML = '';
  for (const row of tbl) {
    const p = await getParticipant(row.playerId, row.teamId);
    list.insertAdjacentHTML('beforeend', `
      <div class="match">
        <div class="team-details">
          <img src="${p.img}" alt=""><strong>${p.name}</strong>
        </div>
        <div>
          <span>Miejsce:</span>
          <div class="badge"><strong>${row.wins}</strong></div>
        </div>
        ${arrowHTML(p)}
      </div>`);
  }
}

// ==================== SIDEBAR ====================
// 1) кешируем модалку
const bracketModal     = document.getElementById('bracketModal');
const modalCloseButton = bracketModal.querySelector('.modal-close');

// 2) закрытие модалки
modalCloseButton.addEventListener('click', () => {
  bracketModal.classList.add('hidden');
});

// 3) SIDEBAR → Net
function initSidebar() {
  const [teamsBtn, gamesBtn, netBtn] = document.querySelectorAll('.sidebar button');
  const h3     = document.querySelector('.match-header h3');
  const gamesNav = document.querySelector('.match-header nav');

  function activate(btn, title, callback, showNav) {
    document.querySelectorAll('.sidebar button').forEach(b =>
      b.classList.toggle('active', b === btn)
    );
    h3.textContent         = title;
    gamesNav.style.display = showNav ? 'flex' : 'none';
    callback();
  }

  // Teams
  activate(teamsBtn, 'Teams:', loadTeams, false);
  teamsBtn.onclick = () =>
    activate(teamsBtn, 'Teams:', loadTeams, false);

  // Games
  gamesBtn.onclick = () => {
    initGamesNav();
    activate(gamesBtn, 'Games:', () => loadMatches('future'), true);
  };

  // Net → «Siatka»
  netBtn.onclick = () => {
    // сначала показываем модалку
    bracketModal.classList.remove('hidden');
    // через небольшой таймаут, чтобы браузер успел отрисовать и дать размеры
    setTimeout(() => {
      initBracket();   // отрисуем сетку уже в видимой модалке
    }, 50);
  };
}


// ==================== Участие ====================
async function userParticipates() {
  const uid = await getMeId();
  if (!uid) return false;
  const arr = await fetch(
    `${API}/competition/players/${COMP_ID}`,
    { headers: authHeaders() }
  ).then(r => r.ok ? r.json() : []);
  return Array.isArray(arr) && arr.includes(uid);
}

// ==================== REGISTRATION ====================
// ... (ваш код модалей и регистрации без изменений)

// ==================== REGISTRATION ====================
const teamModal      = document.getElementById('teamModal');
const playerModal    = document.getElementById('playerModal');
const teamListEl     = document.getElementById('teamList');
const playerListEl   = document.getElementById('playerList');
const teamNextBtn    = document.getElementById('teamNextBtn');
const playerConfBtn  = document.getElementById('playerConfirmBtn');
let _selectedTeam    = null;
let _selectedPlayers = [];

function closeAllModals() {
  teamModal.classList.add('hidden');
  playerModal.classList.add('hidden');
  teamListEl.innerHTML    = '';
  playerListEl.innerHTML  = '';
  teamNextBtn.disabled    = true;
  playerConfBtn.disabled  = true;
  _selectedTeam    = null;
  _selectedPlayers = [];
}

async function openRegistration(comp) {
  if (comp.isIndividual) {
    if (!confirm('Czy na pewno chcesz się zarejestrować?')) return;
    const url = new URL(`${API}/competition/participation`);
    url.searchParams.append('competitionId', COMP_ID);
    const res = await fetch(url, { method:'POST', headers: authHeaders() });
    res.ok ? toast('Зарегистрировано') : toast('Ошибка регистрации', true);
  } else {
    await renderTeamList();
    teamModal.classList.remove('hidden');
  }
}

async function renderTeamList() {
  const me = await getMeId();
  const teams = await fetch(`${API}/team/managed?id=${me}`, { headers: authHeaders() })
    .then(r=>r.ok?r.json():[]);
  teamListEl.innerHTML = '';
  for (const t of teams) {
    const img = await fetch(`${API}/team/team-logo/${t.id}`, { headers: authHeaders() })
      .then(r=>r.ok?r.text():'img/default-team-avatar.png')
      .catch(()=> 'img/default-team-avatar.png');
    const div = document.createElement('div');
    div.className = 'reg-modal__item';
    div.innerHTML = `
      <div class="reg-modal__item-left">
        <div class="reg-modal__avatar">
          <img src="${img}" style="width:30px;height:30px;border-radius:50%">
        </div>
        <span>${t.teamName}</span>
      </div>
      <input type="checkbox" value="${t.id}" />`;
    teamListEl.appendChild(div);
    const chk = div.querySelector('input');
    chk.onchange = () => {
      teamListEl.querySelectorAll('input').forEach(i=>{
        if (i !== chk) i.checked = false;
      });
      _selectedTeam        = chk.checked ? t : null;
      teamNextBtn.disabled = !_selectedTeam;
    };
  }
}

async function onTeamNext() {
  if (!_selectedTeam) return;
  teamModal.classList.add('hidden');
  await renderPlayerList(_selectedTeam);
  playerModal.classList.remove('hidden');
}

async function renderPlayerList(team) {
  const info = await fetch(`${API}/team/currentTeam/${encodeURIComponent(team.teamName)}`, { headers: authHeaders() })
    .then(r=>r.ok?r.json():{members:[]});
  playerListEl.innerHTML = '';
  for (const m of info.members) {
    const user   = await fetch(`${API}/user/getUser/${m.userId}`, { headers: authHeaders() })
      .then(r=>r.ok?r.json():{username:m.userId});
    const avatar = await fetch(`${API}/user/avatar/${user.username}`, { headers: authHeaders() })
      .then(r=>r.ok?r.text():'img/profile.svg')
      .catch(()=> 'img/profile.svg');
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
      </div>`;
    playerListEl.appendChild(div);
    const chk = div.querySelector('input');
    chk.onchange = () => {
      _selectedPlayers = Array.from(
        playerListEl.querySelectorAll('input:checked')
      ).map(i=>i.value);
      playerConfBtn.disabled = !_selectedPlayers.length;
    };
  }
}

async function onPlayersConfirm() {
  if (!_selectedTeam || !_selectedPlayers.length) return;
  const url = new URL(`${API}/competition/participation`);
  url.searchParams.append('competitionId', COMP_ID);
  url.searchParams.append('teamId', _selectedTeam.id);
  _selectedPlayers.forEach(id=> url.searchParams.append('selectedPlayersIds', id));
  const res = await fetch(url, { method:'POST', headers: authHeaders() });
  res.ok ? toast('Зарегистрировано') : toast('Ошибка', true);
  closeAllModals();
}
