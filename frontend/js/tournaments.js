const API = 'http://localhost:8765';
const COMP_ID = localStorage.getItem('searchedTournament');

// --- Global State ---
let meId = null;
let competitionData = null;
let gameSystemData = null;
let allStagesData = [];
let _team = null;
let _players = [];

// --- DOM Element Cache ---
const Elements = {
  container: document.querySelector('.container'),
  tournamentNameStrong: document.querySelector('.tournament-name strong'),
  tournamentNameSpan: document.querySelector('.tournament-name span'),
  banner: document.querySelector('.banner'),
  avatarImg: document.querySelector('.header-avatar img'),
  detailsDivs: document.querySelectorAll('.details div'),
  regBtn: document.querySelector('.register-btn'),
  feedbackContainer: document.querySelector('.feedback'),
  feedbackInputBox: document.querySelector('.feedback-input'),
  sidebarButtons: document.querySelectorAll('.sidebar button'),
  matchListContainer: document.querySelector('.match-list'),
  matchHeader: document.querySelector('.match-header'),
  matchHeaderTitle: document.querySelector('.match-header h3'),
  matchHeaderNav: document.querySelector('.match-header nav'),
  stageNavContainer: document.getElementById('stage-nav-container'),
  toastContainer: null,
  teamModal: document.getElementById('teamModal'),
  playerModal: document.getElementById('playerModal'),
  teamListEl: document.getElementById('teamList'),
  playerListEl: document.getElementById('playerList'),
  teamNextBtn: document.getElementById('teamNextBtn'),
  playerConfBtn: document.getElementById('playerConfirmBtn'),
  teamModalClose: document.getElementById('teamModalClose'),
  playerModalClose: document.getElementById('playerModalClose'),
};

// ==================== HELPER FUNCTIONS ====================
function authHeaders() {
  const t = localStorage.getItem('accToken');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function getMeId() {
  if (meId !== null) return meId;
  if (!localStorage.getItem('accToken')) return null;
  try {
    const m = await fetch(`${API}/user/profile`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null);
    meId = m?.id ?? null;
    return meId;
  } catch (e) {
    meId = null;
    return null;
  }
}

async function getParticipant(pid, tid) {
  if (pid) {
    try {
      const u = await fetch(`${API}/user/getUser/${pid}`, { headers: authHeaders() })
        .then(r => r.ok ? r.json() : null);
      if (!u) return { type: 'player', id: pid, name: `G ${pid}`, img: 'img/profile.svg', username: `G ${pid}` };
      const img = await fetch(`${API}/user/avatar/${u.username}`, { headers: authHeaders() })
        .then(r => r.ok ? r.text() : 'img/profile.svg')
        .catch(() => 'img/profile.svg');
      return { type: 'player', id: pid, name: u.username, img, username: u.username };
    } catch (e) {
      return { type: 'player', id: pid, name: `G ${pid}`, img: 'img/profile.svg', username: `G ${pid}` };
    }
  }
  if (tid) {
       try {

             const tD = await fetch(`${API}/team/current/${tid}`, { headers: authHeaders() })
               .then(r => r.ok ? r.json() : null);
           const tN = tD?.teamName ?? `D ${tid}`;
      const img = await fetch(`${API}/team/team-logo/${tid}`, { headers: authHeaders() })
        .then(r => r.ok ? r.text() : 'img/default-team-avatar.png')
        .catch(() => 'img/default-team-avatar.png');
      return { type: 'team', id: tid, name: tN, img, teamName: tN };
    } catch (e) {
      return { type: 'team', id: tid, name: `D ${tid}`, img: 'img/default-team-avatar.png', teamName: `D ${tid}` };
    }
  }
  return { type: 'unknown', id: null, name: '—', img: 'img/default-team-avatar.png' };
}

function hrefFor(p) {
  if (!p || !p.type) return '#" onclick="return false;';
  if (p.type === 'player' && p.username) return `open-profile.html" onclick="localStorage.setItem('searchedProfile','${p.username}');return true;"`;
  const tLV = p.id || p.teamName;
  if (p.type === 'team' && tLV) return `public-teamPage.html" onclick="localStorage.setItem('searchedTeam','${tLV}');return true;"`;
  return '#" onclick="return false;';
}

const nameHTML = p => `<a href="${hrefFor(p)}" class="participant-link">${p?.name ?? '?'}</a>`;
const arrowHTML = p => `<a href="${hrefFor(p)}" class="details-arrow" title="Przejdź"><img src="img/chevron-right.svg" alt="->"></a>`;

function toast(txt, err = false) {
  if (!Elements.toastContainer) {
    Elements.toastContainer = document.createElement('div');
    Elements.toastContainer.id = 'toastContainer';
    Object.assign(Elements.toastContainer.style, {
      position: 'fixed', right: '0px', left: '0px', bottom: '30px', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center'
    });
    document.body.appendChild(Elements.toastContainer);
  }
  const b = document.createElement('div');
  Object.assign(b.style, {
    background: err ? '#EA3943' : '#3861FB', color: '#fff', padding: '10px 20px',
    marginTop: '8px', borderRadius: '8px', fontSize: '14px', boxShadow: '0 2px 6px rgba(0,0,0,.2)',
    opacity: '0', transition: 'opacity 0.5s ease', maxWidth: '350px', width: 'fit-content', textAlign: 'center'
  });
  b.textContent = txt;
  Elements.toastContainer.prepend(b);
  setTimeout(() => { b.style.opacity = '1'; }, 10);
  setTimeout(() => { b.style.opacity = '0'; setTimeout(() => b.remove(), 500); }, 4000);
}

function handleFatalError(msg, det = "") {
  console.error("Fatal:", msg, det);
  if (Elements.container) {
    Elements.container.innerHTML = `<div class='error-fatal'><h1>Błąd</h1><p>${msg}</p>${det ? `<p><small>${det}</small></p>` : ''}<p><a href="main.html">Strona główna</a></p></div>`;
  }
}

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', initializePage);

async function initializePage() {
  if (!COMP_ID) {
    handleFatalError("Brak ID turnieju.", "Przekierowanie...");
    setTimeout(() => { location.href = 'main.html'; }, 2000);
    return;
  }
  console.log(`Init Comp ID: ${COMP_ID}`);
  if (Elements.matchListContainer) Elements.matchListContainer.innerHTML = '';
  await setupHeaderBasedOnAuth();
  footerMetrics();
  const loaded = await loadEssentialData();
  if (loaded) {
    await Promise.all([loadBanner(), loadFeedback()]);
    initSidebar();
  } else {
    console.error("Init stopped: data load failed.");
  }
}

// ==================== Auth & Header ====================
async function setupHeaderBasedOnAuth() {
  if (localStorage.getItem('accToken') && localStorage.getItem('refToken')) {
    await refreshToken();
  }
  if (!localStorage.getItem('accToken')) {
    document.getElementById('notification_button')?.remove();
    const h = document.getElementById('header_right');
    if (h) h.innerHTML = `<a href="login.html"><div class="registerBtn"><button class="register">Zaloguj się</button></div></a>`;
    if (Elements.feedbackInputBox) Elements.feedbackInputBox.style.display = 'none';
  }
  const lOBtn = document.getElementById('logOut');
  if (lOBtn) lOBtn.onclick = logOutShareLink;
}

async function refreshToken() {
  try {
    const t = localStorage.getItem('refToken');
    if (!t) return;
    const r = await fetch(`${API}/auth/refresh-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}` }
    });
    if (!r.ok) {
      if (r.status === 401 || r.status === 403) {
        localStorage.clear();
        location.reload();
      } else {
        throw new Error(`RF fail: ${r.status}`);
      }
      return;
    }
    const d = await r.json();
    localStorage.setItem('accToken', d.accessToken);
    localStorage.setItem('refToken', d.refreshToken);
    console.log("Token refreshed.");
  } catch (e) {
    console.warn('RT fail:', e);
  }
}

async function logOutShareLink() {
  localStorage.clear();
  try {
    await fetch(`${API}/auth/logout`, { method: 'POST', headers: authHeaders() });
  } catch (e) {}
  finally { location.href = 'main.html'; }
}

// ==================== Core Data Loading ====================
async function loadEssentialData() {
  console.log(`Finding comp ID: ${COMP_ID}`);
  try {
    const r = await fetch(`${API}/competition/all`, { headers: authHeaders() });
    if (!r.ok) throw new Error(`List err: ${r.status}`);
    const l = await r.json();
    if (!Array.isArray(l)) throw new Error("Invalid list.");
    competitionData = l.find(c => c.id === COMP_ID);
    if (!competitionData) {
      handleFatalError(`Turniej ${COMP_ID} nie znaleziony.`);
      return false;
    }
    if (!competitionData.gameSystemId) throw new Error("Missing gameSystemId.");
    const gR = await fetch(`${API}/game-system/get/${competitionData.gameSystemId}`, { headers: authHeaders() });
    if (!gR.ok) throw new Error(`GS err: ${gR.status}`);
    gameSystemData = await gR.json();
    if (!gameSystemData) throw new Error("GS parse err.");
    updateCompetitionUI();
    updateSidebarButton();
    return true;
  } catch (e) {
    console.error("Load err:", e);
    handleFatalError(`Błąd: ${e.message}`);
    competitionData = null;
    gameSystemData = null;
    return false;
  }
}

// ==================== UI Updates ====================
async function updateCompetitionUI() {
  if (!competitionData || !gameSystemData) return;
  const comp = competitionData, gs = gameSystemData, isInd = gs.isIndividual;
  if (Elements.tournamentNameStrong) Elements.tournamentNameStrong.textContent = comp.name || '?';
  let sportName = '?';
  try {
    const s = await fetch(`${API}/sport/id/${comp.sportId}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null);
    if (s && s.name) sportName = s.name;
    if (Elements.tournamentNameSpan) Elements.tournamentNameSpan.textContent = sportName;
    if (Elements.detailsDivs.length > 0 && Elements.detailsDivs[0]) Elements.detailsDivs[0].querySelector('strong').textContent = sportName;
  } catch (e) {
    if (Elements.tournamentNameSpan) Elements.tournamentNameSpan.textContent = '!';
    if (Elements.detailsDivs.length > 0 && Elements.detailsDivs[0]) Elements.detailsDivs[0].querySelector('strong').textContent = '!';
  }
  if (Elements.detailsDivs.length >= 4) {
    const mD = isInd ? '1v1' : (gs.playersPerTeam ? `${gs.playersPerTeam}v${gs.playersPerTeam}` : '?v?');
    Elements.detailsDivs[1].querySelector('strong').textContent = mD;
    updateParticipantCountDisplay();
    Elements.detailsDivs[3].querySelector('strong').textContent = comp.startDate ? new Date(comp.startDate).toLocaleDateString('pl-PL') : '?';
  }
  await updateRegistrationButtonVisibility();
  await updateFeedbackInputVisibility();
}

async function updateParticipantCountDisplay() {
  if (!gameSystemData || !Elements.detailsDivs[2]) return;
  const isInd = gameSystemData.isIndividual;
  const cE = Elements.detailsDivs[2].querySelector('strong');
  cE.textContent = '.../...';
  let maxP = gameSystemData.maxTeamSize ?? '?';
  let cur = 0;
  try {
    if (isInd) {
      const pA = await fetch(`${API}/competition/players/${COMP_ID}`, { headers: authHeaders() })
        .then(r => r.ok ? r.json() : []);
      cur = Array.isArray(pA) ? pA.length : 0;
    } else {
      const tR = await fetch(`${API}/competition/league-table/${COMP_ID}`, { headers: authHeaders() });
      const tA = tR.ok ? await tR.json() : [];
      cur = Array.isArray(tA) ? tA.length : 0;
    }
    cE.textContent = `${cur} / ${maxP}`;
    console.log(`Participant count: ${cur}/${maxP}`);
  } catch (e) {
    console.error("P count err:", e);
    cE.textContent = `! / ${maxP}`;
  }
}

async function updateRegistrationButtonVisibility() {
  if (!Elements.regBtn || !competitionData) return;
  Elements.regBtn.style.display = 'none';
  try {
    const canJoin = !['ACTIVE', 'COMPLETED', 'CANCELLED']
        .includes(competitionData.status?.toUpperCase())
      && !(await userParticipates());
    console.log(`Can join: ${canJoin}, Competition status: ${competitionData.status}, User participates: ${await userParticipates()}`);
    if (canJoin) {
      // Check participant count against maxTeamSize
      let currentCount = 0;
      if (gameSystemData.isIndividual) {
        const players = await fetch(`${API}/competition/players/${COMP_ID}`, { headers: authHeaders() })
          .then(r => r.ok ? r.json() : []);
        currentCount = Array.isArray(players) ? players.length : 0;
      } else {
        const teams = await fetch(`${API}/competition/league-table/${COMP_ID}`, { headers: authHeaders() })
          .then(r => r.ok ? r.json() : []);
        currentCount = Array.isArray(teams) ? teams.length : 0;
      }
      const maxCount = gameSystemData.maxTeamSize || Infinity;
      if (currentCount >= maxCount) {
        console.log('Registration disabled: Maximum participants reached');
        return;
      }
      Elements.regBtn.style.display = 'block';
      Elements.regBtn.removeEventListener('click', openRegistration);
      Elements.regBtn.addEventListener('click', openRegistration);
      console.log('Registration button enabled');
    } else {
      console.log('Registration button hidden: User cannot join');
    }
  } catch (e) {
    console.error("Registration visibility err:", e);
  }
}

async function updateFeedbackInputVisibility() {
  if (!Elements.feedbackInputBox) return;
  Elements.feedbackInputBox.style.display = 'none';
  if (!localStorage.getItem('accToken')) return;
  try {
    if (await userParticipates()) {
      Elements.feedbackInputBox.style.display = 'flex';
      const i = Elements.feedbackInputBox.querySelector('input'),
        b = Elements.feedbackInputBox.querySelector('button');
      b.disabled = !i.value.trim();
      i.oninput = () => b.disabled = !i.value.trim();
      b.onclick = () => sendFeedback(i, b);
    }
  } catch (e) {}
}

function updateSidebarButton() {
  const tB = Elements.sidebarButtons[0];
  if (!tB || !gameSystemData) return;
  const iI = gameSystemData.isIndividual;
  const bT = iI ? 'Gracze' : 'Drużyny';
  const bI = iI ? 'img/shield-user.svg' : 'img/shield-user.svg';
  tB.innerHTML = `<img src="${bI}" alt=""> ${bT}`;
  if (tB.classList.contains('active') && Elements.matchHeaderTitle) {
    Elements.matchHeaderTitle.textContent = bT + ':';
  }
}

async function loadBanner() {
  if (!competitionData) return;
  try {
    const url = await fetch(`${API}/competition/get-image/${COMP_ID}`, { headers: authHeaders() })
      .then(r => r.ok ? r.text() : null);
    if (url && Elements.banner && Elements.avatarImg) {
      Elements.banner.style.background = `url(${url}) center/cover`;
      Elements.avatarImg.src = url;
    } else if (url === null) {
      throw new Error("No URL");
    }
  } catch (e) {
    if (Elements.banner) Elements.banner.style.background = '#e9ecef';
    if (Elements.avatarImg) Elements.avatarImg.src = 'img/users.svg';
  }
}

// ==================== Feedback ====================
async function loadFeedback() {
  const wrap = Elements.feedbackContainer;
  if (!wrap) return;
  wrap.querySelectorAll('.comment').forEach(x => x.remove());
  if (!competitionData) return;
  let me = null;
  try {
    me = await getMeId();
    const data = await fetch(`${API}/feedback/get-by-competition?competitionId=${COMP_ID}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : []);
    const emo = { 'very positive': '😍', 'positive': '😊', 'neutral': '😐', 'negative': '😕', 'very negative': '😡' };
    if (data.length === 0) {
      wrap.insertAdjacentHTML('beforeend', '<div class="comment info-placeholder">Brak komentarzy.</div>');
      return;
    }
    for (const f of data) {
      const u = await fetch(`${API}/user/getUser/${f.userId}`, { headers: authHeaders() })
        .then(r => r.ok ? r.json() : { username: '?' });
      const av = await fetch(`${API}/user/avatar/${u.username}`, { headers: authHeaders() })
        .then(r => r.ok ? r.text() : 'img/profile.svg')
        .catch(() => 'img/profile.svg');
      const when = f.createdAt ? new Date(f.createdAt).toLocaleString('pl-PL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '';
      wrap.insertAdjacentHTML('beforeend', `<div class="comment" data-id="${f.id}"><div class="comment-header"><div class="avatar-comment"><img src="${av}"></div><span>${u.username}</span><span class="timestamp">${when}</span>${f.userId === me ? `<button class="del-btn" title="Usuń" style="background:none;border:none;cursor:pointer;padding:2px 4px;margin-left:5px;font-size:15px;line-height:1;color:#aaa;">🗑️</button>` : ''}</div><p>${f.message || ''}</p><div class="comment-reactions"><span title="Tonalność: ${f.tonality || '?'}">${emo[f.tonality] || '😐'}</span><button class="like-btn" title="Polub" style="padding: 0 !important;background: none;border: none"><img src="img/thumbs-up.svg" style="width:16px;height:16px;"><span style="font-size:13px;color:#666;">${f.likes || 0}</span></button></div></div>`);
    }
    wrap.querySelectorAll('.like-btn').forEach(b => { b.onclick = handleLikeClick; });
    wrap.querySelectorAll('.del-btn').forEach(b => { b.onclick = handleDeleteClick; });
  } catch (e) {
    console.error("Feedback load err:", e);
    wrap.innerHTML = '<div class="comment error-placeholder">Nie udało się załadować komentarzy.</div>';
  }
}

async function sendFeedback(inp, btn) {
  if (!competitionData) { toast("Błąd.", true); return; }
  const msg = inp.value.trim();
  if (!msg) return;
  btn.disabled = true;
  try {
    const res = await fetch(`${API}/feedback/create/${COMP_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ message: msg })
    });
    if (!res.ok) {
      const d = await res.text();
      toast(`Błąd: ${d || res.statusText}`, true);
      btn.disabled = !inp.value.trim();
      return;
    }
    toast('Wysłano');
    inp.value = '';
    loadFeedback();
  } catch (e) {
    toast("Błąd sieci.", true);
    btn.disabled = !inp.value.trim();
  }
}

async function handleLikeClick(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  if (!await getMeId()) { toast('Zaloguj się.', true); return; }
  const c = btn.closest('.comment');
  if (!c) return;
  const id = c.dataset.id;
  btn.disabled = true;
  try {
    const r = await fetch(`${API}/feedback/like/${id}`, { method: 'PUT', headers: authHeaders() });
    if (r.ok) {
      const s = btn.querySelector('span');
      s.textContent = parseInt(s.textContent) + 1;
      toast('Polubiono');
    } else {
      toast(`Błąd: ${r.statusText}`, true);
      btn.disabled = false;
    }
  } catch (e) {
    toast("Błąd sieci.", true);
    btn.disabled = false;
  }
}

async function handleDeleteClick(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  if (!confirm('Usunąć?')) return;
  const c = btn.closest('.comment');
  if (!c) return;
  const id = c.dataset.id;
  btn.disabled = true;
  try {
    const r = await fetch(`${API}/feedback/delete/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (r.ok) {
      c.remove();
      toast('Usunięto');
    } else {
      toast(`Błąd: ${r.statusText}`, true);
      btn.disabled = false;
    }
  } catch (e) {
    toast("Błąd sieci.", true);
    btn.disabled = false;
  }
}

// ==================== Sidebar & Content Loading ====================
function initSidebar() {
  if (Elements.sidebarButtons.length < 3) return;
  const [teamsBtn, gamesBtn, netBtn] = Elements.sidebarButtons;
  const stageNavContainer = Elements.stageNavContainer;

  function activate(btn, title, callback, showGamesNav) {
    Elements.sidebarButtons.forEach(b => b.classList.toggle('active', b === btn));
    if (Elements.matchHeaderTitle) Elements.matchHeaderTitle.textContent = title;
    if (Elements.matchHeaderNav) Elements.matchHeaderNav.style.display = showGamesNav ? 'flex' : 'none';
    if (stageNavContainer) stageNavContainer.style.display = !showGamesNav && btn === netBtn ? 'flex' : 'none';
    const headerEl = Elements.matchListContainer?.querySelector('.match-list-header');
    if (headerEl) headerEl.style.display = (showGamesNav || btn === netBtn) ? 'grid' : 'none';
    if (callback) callback();
  }

  teamsBtn.onclick = () => {
    const currentText = teamsBtn.textContent.trim() || 'Uczestnicy';
    activate(teamsBtn, currentText + ':', loadParticipantsList, false);
  };
  gamesBtn.onclick = () => {
    activate(gamesBtn, 'Mecze:', initGamesNav, true);
  };
  netBtn.onclick = () => {
    activate(netBtn, 'Drabinka:', loadStageDataAndNav, false);
  };

  const activeButton = document.querySelector('.sidebar button.active');
  if (!activeButton || activeButton === gamesBtn) {
    activate(gamesBtn, 'Mecze:', initGamesNav, true);
  } else {
    activeButton.click();
  }
}

function initGamesNav() {
  if (!Elements.matchHeaderNav) return;
  const btns = Elements.matchHeaderNav.querySelectorAll('button');
  btns.forEach(b => {
    b.onclick = () => {
      btns.forEach(b2 => b2.classList.toggle('active', b === b2));
      loadMatches(b.textContent.trim().toLowerCase());
    };
  });
  if (!Elements.matchHeaderNav.querySelector('button.active')) {
    const fBtn = Array.from(btns).find(b => b.textContent.trim().toLowerCase() === 'future');
    if (fBtn) {
      fBtn.classList.add('active');
      loadMatches('future');
    } else if (btns.length > 0) {
      btns[0].classList.add('active');
      loadMatches(btns[0].textContent.trim().toLowerCase());
    }
  } else {
    const aBtn = Elements.matchHeaderNav.querySelector('button.active');
    loadMatches(aBtn.textContent.trim().toLowerCase());
  }
}

async function loadParticipantsList () {
  if (!Elements.matchListContainer) return;
  Elements.matchListContainer.innerHTML = '<div class="loading-placeholder">Ładowanie…</div>';

  try {
    const ids = await fetchParticipantIds();           // ← новый вызов
    if (!ids.length) {
      Elements.matchListContainer.innerHTML = '<div class="info-placeholder">Brak.</div>';
      return;
    }

    // превращаем ID → объекты {type,name,img,…}
    const parts = await Promise.all(
      ids.map(id => gameSystemData.isIndividual
        ? getParticipant(id, null)      // игрок
        : getParticipant(null, id))     // команда
    );

    parts.sort((a,b) => (a.name || '').localeCompare(b.name || ''));

    Elements.matchListContainer.innerHTML = '';        // очищаем
    for (const p of parts) {
      Elements.matchListContainer.insertAdjacentHTML(
        'beforeend',
        `<div class="match participant-item">
           <div class="team-details">
             <img src="${p.img}"
            style="width:32px;height:32px;border-radius:50%;object-fit:cover;">
            ${nameHTML(p)}
           </div>
           ${arrowHTML(p)}
         </div>`
      );
    }
  } catch (e) {
    console.error('Participants list error:', e);
    Elements.matchListContainer.innerHTML =
      '<div class="error-placeholder">Błąd ładowania uczestników.</div>';
  }
}


async function loadMatches(filter) {
  if (!Elements.matchListContainer) return;
  Elements.matchListContainer.innerHTML = '<div class="loading-placeholder">Ładowanie...</div>';
  if (!competitionData) {
    Elements.matchListContainer.innerHTML = '<div class="error-placeholder">Błąd C.</div>';
    return;
  }

  try {
    // Получаем все матчи, сгруппированные по стадиям
    const gBS = await fetch(`${API}/match/grouped-by-stage/${COMP_ID}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject());
    if (!gBS || gBS.length === 0) {
      Elements.matchListContainer.innerHTML = '<div class="info-placeholder">Brak M.</div>';
      return;
    }

    // Флатим список
    const matches = gBS.flatMap(s => (s.matchList || []).map(m => ({ ...m, stageName: s.stageName || `E ${s.stageOrder}` })));
    if (!matches.length) {
      Elements.matchListContainer.innerHTML = '<div class="info-placeholder">Brak M.</div>';
      return;
    }

    // Фильтруем по статусу
    const map = {
      future: ['SCHEDULED','WAITING_FOR_OPPONENT'],
      present: ['IN_PROGRESS'],
      past: ['FINISHED','CANCELLED','BYE','AUTO_WIN','WALKOVER']
    };
    const filtered = matches.filter(m => map[filter]?.includes(m.matchStatus));
    if (!filtered.length) {
      Elements.matchListContainer.innerHTML = `<div class="info-placeholder">Brak ${filter} M.</div>`;
      return;
    }

    // Сортировка по дате/времени
    filtered.sort((a,b) => {
      const dA = a.matchDate ? new Date(a.matchDate).getTime() : (filter==='past'? -Infinity: Infinity);
      const dB = b.matchDate ? new Date(b.matchDate).getTime() : (filter==='past'? -Infinity: Infinity);
      return filter==='past'? dB - dA : dA - dB;
    });

    // Рендер заголовка таблицы
    Elements.matchListContainer.innerHTML = '';
    Elements.matchListContainer.insertAdjacentHTML('beforeend', `
      <div class="match-list-header">
        <div><span>Start:</span></div>
        <div><span>Gra:</span></div>
        <div><span>Runda:</span></div>
      </div>
    `);

    // Предварительный загруз участников
    const participantsData = await Promise.all(
      filtered.map(m => Promise.all([
        getParticipant(m.playerAId, m.teamAId),
        getParticipant(m.playerBId, m.teamBId)
      ]))
    );

    // Рендер самих матчей
    filtered.forEach((m, idx) => {
      const [L,R] = participantsData[idx];
      const dt = m.matchDate ? new Date(m.matchDate) : null;
      const tS = dt ? dt.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}) : 'TBD';
      const dS = dt ? dt.toLocaleDateString('pl-PL') : '';
      const sA = m.scoreA!==null? m.scoreA : '—';
      const sB = m.scoreB!==null? m.scoreB : '—';

      // Определяем стили для победителя/проигравшего
      let clsA='', clsB='';
      if (['FINISHED','AUTO_WIN','WALKOVER'].includes(m.matchStatus)) {
        const w = m.winnerPlayerId ?? m.winnerTeamId;
        const idA = m.playerAId ?? m.teamAId, idB = m.playerBId ?? m.teamBId;
        if (w===idA) clsA='match-winner', clsB='match-loser';
        else if (w===idB) clsB='match-winner', clsA='match-loser';
      }

      Elements.matchListContainer.insertAdjacentHTML('beforeend', `
        <div class="match">
          <div class="match-time">
            <strong>${tS}</strong><span> ${dS}</span>
          </div>
          <div class="team-details">
            <strong class="${clsA}">${nameHTML(L)}</strong>
            <img src="${L.img}" alt="">
            <strong> ${sA} : ${sB} </strong>
            <img src="${R.img}" alt="">
            <strong class="${clsB}">${nameHTML(R)}</strong>
          </div>
          <div class="match-stage">
            <strong>${m.stageName}</strong>
          </div>
        </div>
      `);
    });

    // === ВАЖНО: привязываем переход по клику к каждой .match ===
    Elements.matchListContainer.querySelectorAll('.match').forEach((el, i) => {
      const matchId = filtered[i].id;
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        localStorage.setItem('searchedMatch', matchId);
        window.location.href = 'match-page.html';
      });
    });

  } catch (err) {
    console.error("Load M err:", err);
    Elements.matchListContainer.innerHTML = `<div class="error-placeholder">Błąd M.</div>`;
  }
}

// ==================== Bracket Logic (Stage Navigation View) ====================
async function loadStageDataAndNav() {
  const stageNavContainer = Elements.stageNavContainer;
  if (!stageNavContainer || !Elements.matchListContainer) return;
  stageNavContainer.innerHTML = '<div class="loading-placeholder">Ładuję...</div>';
  Elements.matchListContainer.innerHTML = '';
  try {
    const stages = await fetch(`${API}/match/grouped-by-stage/${COMP_ID}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject(`Etapy: ${r.status}`));
    if (!stages || stages.length === 0) {
      stageNavContainer.innerHTML = '<div class="info-placeholder">Brak etapów.</div>';
      Elements.matchListContainer.innerHTML = '<div class="info-placeholder">Brak meczów.</div>';
      return;
    }
    stages.sort((a, b) => a.stageOrder - b.stageOrder);
    allStagesData = stages;
    stageNavContainer.innerHTML = '';
    allStagesData.forEach((stage, index) => {
      const btn = document.createElement('button');
      btn.textContent = stage.stageName || `Etap ${stage.stageOrder}`;
      btn.dataset.stageIndex = index;
      btn.classList.add('stage-nav-button');
      if (index === 0) { btn.classList.add('active'); }
      btn.onclick = handleStageNavClick;
      stageNavContainer.appendChild(btn);
    });
    displayMatchesForStage(0);
  } catch (e) {
    console.error("Stage nav err:", e);
    stageNavContainer.innerHTML = '<div class="error-placeholder">Błąd etapów.</div>';
    Elements.matchListContainer.innerHTML = '<div class="error-placeholder">Błąd meczów.</div>';
  }
}

function handleStageNavClick(event) {
  const clickedButton = event.currentTarget;
  const stageIndex = parseInt(clickedButton.dataset.stageIndex, 10);
  const stageNavContainer = Elements.stageNavContainer;
  stageNavContainer?.querySelectorAll('.stage-nav-button').forEach(btn => btn.classList.remove('active'));
  clickedButton.classList.add('active');
  displayMatchesForStage(stageIndex);
}

function displayMatchesForStage(stageIndex) {
  if (!Elements.matchListContainer || !allStagesData || stageIndex >= allStagesData.length) {
    Elements.matchListContainer.innerHTML = '<div class="error-placeholder">Błąd: Etap.</div>';
    return;
  }
  const stage = allStagesData[stageIndex];
  const list  = stage.matchList || [];
  Elements.matchListContainer.innerHTML = '';

  if (!list.length) {
    Elements.matchListContainer.innerHTML = '<div class="info-placeholder">Brak meczów.</div>';
    return;
  }

  // Заголовок
  Elements.matchListContainer.insertAdjacentHTML('beforeend', `
    <div class="match-list-header">
      <div><span>Start:</span></div>
      <div><span>Gra:</span></div>
      <div><span>ID Meczu:</span></div>
    </div>
  `);

  // Загружаем всех участников
  Promise.all(list.map(m => Promise.all([
    getParticipant(m.playerAId, m.teamAId),
    getParticipant(m.playerBId, m.teamBId)
  ])))
    .then(partArr => {
      list.forEach((m, i) => {
        const [L,R] = partArr[i];
        const dt = m.matchDate ? new Date(m.matchDate) : null;
        const tS = dt ? dt.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}) : 'TBD';
        const dS = dt ? dt.toLocaleDateString('pl-PL') : '';
        const sA = m.scoreA!==null? m.scoreA : '—';
        const sB = m.scoreB!==null? m.scoreB : '—';

        // Победитель/проигравший
        let clsA='', clsB='';
        if (['FINISHED','AUTO_WIN','WALKOVER'].includes(m.matchStatus)) {
          const w = m.winnerPlayerId ?? m.winnerTeamId;
          const idA = m.playerAId ?? m.teamAId, idB = m.playerBId ?? m.teamBId;
          if (w===idA) clsA='match-winner', clsB='match-loser';
          else if (w===idB) clsB='match-winner', clsA='match-loser';
        }

        Elements.matchListContainer.insertAdjacentHTML('beforeend', `
        <div class="match">
          <div class="match-time">
            <strong>${tS}</strong><span> ${dS}</span>
          </div>
          <div class="team-details">
            <strong class="${clsA}">${nameHTML(L)}</strong>
            <img src="${L.img}" alt="">
            <strong> ${sA} : ${sB} </strong>
            <img src="${R.img}" alt="">
            <strong class="${clsB}">${nameHTML(R)}</strong>
          </div>
          <div class="match-stage">
            <strong title="${m.id}">${m.id.substring(0,8)}...</strong>
          </div>
        </div>
      `);
      });

      // === И тут тоже привязываем переход ===
      Elements.matchListContainer.querySelectorAll('.match').forEach((el,i) => {
        const matchId = list[i].id;
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
          localStorage.setItem('searchedMatch', matchId);
          window.location.href = 'match-page.html';
        });
      });
    })
    .catch(err => {
      console.error(`Stage ${stageIndex} err:`, err);
      Elements.matchListContainer.innerHTML = `<div class="error-placeholder">Błąd etapu.</div>`;
    });
}

// ==================== Participation Check ====================
async function userParticipates() {
  const uid = await getMeId();
  if (!uid) return false;
  if (!gameSystemData) { return false; }
  const isInd = gameSystemData.isIndividual;
  try {
    if (isInd) {
      const p = await fetch(`${API}/competition/players/${COMP_ID}`, { headers: authHeaders() })
        .then(r => r.ok ? r.json() : []);
      return Array.isArray(p) && p.includes(uid);
    } else {
      const uT = await fetch(`${API}/team/get-teams-by-userId?userId=${uid}`, { headers: authHeaders() })
        .then(r => r.ok ? r.json() : []);
      if (!uT || uT.length === 0) return false;
      const tR = await fetch(`${API}/competition/league-table/${COMP_ID}`, { headers: authHeaders() });
      if (!tR.ok) {
        if (tR.status === 404) { return false; }
        throw new Error();
      }
      const tT = await tR.json();
      if (!Array.isArray(tT)) return false;
      const uTIds = uT.map(t => t.id);
      return tT.some(tTId => uTIds.includes(tTId));
    }
  } catch (e) {
    return false;
  }
}

// ==================== Registration Logic ====================
function closeAllRegModals() {
  ['teamModal', 'playerModal'].forEach(id => {
    if (Elements[id]) {
      Elements[id].classList.add('hidden');
      console.log(`${id} closed`);
    }
  });
  if (Elements.teamListEl) Elements.teamListEl.innerHTML = '';
  if (Elements.playerListEl) Elements.playerListEl.innerHTML = '';
  if (Elements.teamNextBtn) Elements.teamNextBtn.disabled = true;
  if (Elements.playerConfBtn) Elements.playerConfBtn.disabled = true;
  _team = null;
  _players = [];
  console.log('Registration state reset');
}

Elements.teamModalClose?.addEventListener('click', closeAllRegModals);
Elements.playerModalClose?.addEventListener('click', closeAllRegModals);

async function openRegistration() {
  console.log('Registration button clicked');
  if (!competitionData || !gameSystemData) {
    console.error('Missing competition or game system data');
    toast('Błąd: Brak danych turnieju.', true);
    return;
  }
  const userId = await getMeId();
  if (!userId) {
    console.error('User not logged in');
    toast('Zaloguj się, aby się zarejestrować.', true);
    return;
  }
  const isIndividual = gameSystemData.isIndividual;
  console.log('Tournament type:', isIndividual ? 'Individual' : 'Team');

  // Refresh token before registration
  await refreshToken();
  const token = localStorage.getItem('accToken');
  if (!token) {
    console.error('No valid token after refresh');
    toast('Sesja wygasła. Spróbuj zalogować się ponownie.', true);
    return;
  }
  console.log('Authorization token:', token);

  if (isIndividual) {
    if (!confirm('Dołączyć do turnieju?')) {
      console.log('Individual registration cancelled');
      return;
    }
    try {
      console.log('Sending individual registration request');
      const url = `${API}/competition/participation?competitionId=${encodeURIComponent(COMP_ID)}`;
      console.log('Individual registration URL:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...authHeaders(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Individual registration failed:', response.status, errorText);
        if (response.status === 401 || response.status === 403) {
          toast('Brak autoryzacji. Sprawdź swoje uprawnienia lub zaloguj się ponownie.', true);
          return;
        }
        throw new Error(errorText || 'Nie udało się zarejestrować');
      }
      console.log('Individual registration successful');
      toast('Zarejestrowano ✅');
      await afterSuccessfulRegistration();
    } catch (e) {
      console.error('Individual registration error:', e);
      toast(e.message || 'Błąd rejestracji', true);
    }
    return;
  }

  // Team registration
  try {
    if (!Elements.teamModal) {
      console.error('Team modal not found');
      toast('Błąd: Brak modala drużyny. Skontaktuj się z administratorem.', true);
      return;
    }
    await renderTeamList();
    Elements.teamModal.classList.remove('hidden');
    console.log('Team modal opened');
  } catch (e) {
    console.error('Failed to open team modal:', e);
    toast('Problem z załadowaniem drużyn', true);
  }
}

async function renderTeamList() {
  const box = Elements.teamListEl;
  if (!box) {
    console.error('Team list element not found');
    toast('Błąd: Brak elementu listy drużyn.', true);
    return;
  }
  box.textContent = 'Ładowanie…';
  if (Elements.teamNextBtn) Elements.teamNextBtn.disabled = true;
  _team = null;
  const userId = await getMeId();
  if (!userId) {
    console.error('User not logged in');
    box.textContent = 'Musisz być zalogowany.';
    toast('Zaloguj się.', true);
    return;
  }

  try {
    console.log('Fetching managed teams for user:', userId);
    const response = await fetch(`${API}/team/managed?id=${userId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      console.error('Failed to fetch teams:', response.status);
      throw new Error('Nie udało się pobrać drużyn');
    }
    const teams = await response.json();
    console.log('Fetched teams:', teams);

    if (!teams.length) {
      box.textContent = 'Brak drużyn.';
      console.log('No teams available');
      return;
    }

    box.innerHTML = '';
    for (const team of teams) {
      try {
        const logo = await fetch(`${API}/team/team-logo/${team.id}`, {
          headers: authHeaders(),
        })
          .then(r => (r.ok ? r.text() : 'img/default-team-avatar.png'))
          .catch(() => 'img/default-team-avatar.png');
        box.insertAdjacentHTML('beforeend', `
          <label class="reg-modal__item">
            <div class="reg-modal__item-left">
              <div class="reg-modal__avatar"><img src="${logo}" width="30" height="30"></div>
              <span>${team.teamName}</span>
            </div>
            <input type="radio" name="teamSelection" value="${team.id}" data-team-name="${team.teamName}">
          </label>`);
      } catch (e) {
        console.error('Error loading team logo for team:', team.id, e);
      }
    }

    box.querySelectorAll('input[name="teamSelection"]').forEach(radio => {
      radio.addEventListener('change', () => {
        _team = { id: radio.value, teamName: radio.dataset.teamName };
        if (Elements.teamNextBtn) Elements.teamNextBtn.disabled = false;
        console.log('Selected team:', _team);
      });
    });
  } catch (e) {
    console.error('Error rendering team list:', e);
    box.textContent = 'Błąd ładowania drużyn.';
    toast('Błąd ładowania drużyn', true);
  }
}

Elements.teamNextBtn?.addEventListener('click', async () => {
  if (!_team) {
    console.error('No team selected');
    toast('Wybierz drużynę.', true);
    return;
  }
  console.log('Proceeding to player selection for team:', _team);
  Elements.teamModal?.classList.add('hidden');
  try {
    await renderPlayerList(_team);
    if (Elements.playerModal) {
      Elements.playerModal.classList.remove('hidden');
      console.log('Player modal opened');
    } else {
      console.error('Player modal not found');
      toast('Błąd: Brak modala graczy.', true);
    }
  } catch (e) {
    console.error('Error opening player modal:', e);
    toast('Błąd ładowania graczy.', true);
  }
});

async function renderPlayerList(team) {
  const box = Elements.playerListEl;
  if (!box) {
    console.error('Player list element not found');
    toast('Błąd: Brak elementu listy graczy.', true);
    return;
  }
  box.textContent = `Ładowanie ${team.teamName}…`;
  if (Elements.playerConfBtn) Elements.playerConfBtn.disabled = true;
  _players = [];

  try {
    console.log('Fetching team members for team:', team.teamName);
    const response = await fetch(`${API}/team/currentTeam/${encodeURIComponent(team.teamName)}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      console.error('Failed to fetch team members:', response.status);
      throw new Error('Nie udało się pobrać składu drużyny');
    }
    const info = await response.json();
    console.log('Team members:', info.members);

    if (!info.members.length) {
      box.textContent = 'Brak składu.';
      console.log('No team members available');
      return;
    }

    const reqPlayers = +(gameSystemData.playersPerTeam ?? gameSystemData.minTeamSize ?? 1);
    const maxPlayers = +(gameSystemData.maxTeamSize ?? info.members.length);
    box.innerHTML = `<div>Wybierz graczy (${reqPlayers}-${maxPlayers}):</div>`;

    for (const member of info.members) {
      try {
        const user = await fetch(`${API}/user/getUser/${member.userId}`, {
          headers: authHeaders(),
        })
          .then(r => (r.ok ? r.json() : { username: `#${member.userId}` }));
        const avatar = await fetch(`${API}/user/avatar/${user.username}`, {
          headers: authHeaders(),
        })
          .then(r => (r.ok ? r.text() : 'img/profile.svg'))
          .catch(() => 'img/profile.svg');
        box.insertAdjacentHTML('beforeend', `
          <div class="reg-modal__item">
            <div class="reg-modal__item-left">
              <div class="reg-modal__avatar"><img src="${avatar}" width="30" height="30"></div>
              <span>${user.username}</span>
            </div>
            <div style="display:flex;align-items:center;gap:12px">
              <time style="font-size:12px;color:#666">
                ${member.createdAt ? new Date(member.createdAt).toLocaleDateString('pl-PL') : ''}
              </time>
              <input type="checkbox" value="${member.userId}">
            </div>
          </div>`);
      } catch (e) {
        console.error('Error loading player data for user:', member.userId, e);
      }
    }

    box.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        _players = Array.from(box.querySelectorAll('input:checked')).map(input => input.value);
        const isValid = _players.length >= reqPlayers && _players.length <= maxPlayers;
        if (Elements.playerConfBtn) Elements.playerConfBtn.disabled = !isValid;
        box.querySelectorAll('input:not(:checked)').forEach(input => {
          input.disabled = _players.length >= maxPlayers;
        });
        console.log('Selected players:', _players);
      });
    });
  } catch (e) {
    console.error('Error rendering player list:', e);
    box.textContent = 'Błąd ładowania graczy.';
    toast('Błąd ładowania graczy', true);
  }
}

Elements.playerConfBtn?.addEventListener('click', async () => {
  if (!_team || !_players.length) {
    console.error('Team or players not selected', { team: _team, players: _players });
    toast('Wybierz drużynę i graczy.', true);
    return;
  }

  // Check if the team is already registered
  try {
    const teamsInCompetition = await fetch(`${API}/competition/league-table/${COMP_ID}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : []);
    if (teamsInCompetition.includes(_team.id)) {
      console.log('Team already registered:', _team.id);
      toast('Ta drużyna jest już zarejestrowana w turnieju.', true);
      return;
    }
  } catch (e) {
    console.error('Error checking team registration status:', e);
    toast('Błąd sprawdzania statusu drużyny.', true);
    return;
  }

  console.log('Submitting team registration:', { team: _team, players: _players });
  try {
    // Refresh token before registration
    await refreshToken();
    const token = localStorage.getItem('accToken');
    if (!token) {
      console.error('No valid token after refresh');
      toast('Sesja wygasła. Spróbuj zalogować się ponownie.', true);
      return;
    }
    console.log('Authorization token for registration:', token);

    // Construct the URL with query parameters
    const playerParams = _players.map(id => `selectedPlayersIds=${encodeURIComponent(id)}`).join('&');
    const url = `${API}/competition/participation?competitionId=${encodeURIComponent(COMP_ID)}&teamId=${encodeURIComponent(_team.id)}&${playerParams}`;
    console.log('Team registration URL:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...authHeaders(),
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Team registration failed:', response.status, errorText);
      if (response.status === 401 || response.status === 403) {
        toast('Brak autoryzacji. Sprawdź swoje uprawnienia lub zaloguj się ponownie.', true);
        return;
      }
      throw new Error(errorText || 'Nie udało się zarejestrować drużyny');
    }
    console.log('Team registration successful');
    toast('Drużyna zgłoszona! ✅');
    closeAllRegModals();
    await afterSuccessfulRegistration();
  } catch (e) {
    console.error('Team registration error:', e);
    toast(e.message || 'Błąd rejestracji drużyny', true);
  }
});

async function afterSuccessfulRegistration() {
  console.log('Updating UI after successful registration');
  try {
    await loadEssentialData();
    updateParticipantCountDisplay();
    updateRegistrationButtonVisibility();
    loadParticipantsList();
  } catch (e) {
    console.error('Post-registration update error:', e);
    toast('Błąd aktualizacji po rejestracji.', true);
  }
}

function footerMetrics() {
  const s1 = document.querySelector('.footer-content span:nth-child(3)');
  const s2 = document.querySelector('.footer-content span:nth-child(4)');
  if (!s1 || !s2) return;
  window.addEventListener('load', () => setTimeout(() => {
    if (performance && performance.timing) {
      const t = performance.timing;
      const lT = t.loadEventEnd - t.navigationStart;
      const tT = t.responseEnd - t.responseStart;
      if (lT > 0 && isFinite(lT)) {
        s1.innerHTML = `Strona: <span class="blue">${Math.round(lT)}ms</span>`;
      }
      if (tT > 0 && isFinite(tT)) {
        s2.innerHTML = `Szablon: <span class="blue">${Math.round(tT)}ms</span>`;
      }
    }
  }, 0));
}
async function fetchParticipantIds () {
  const res = await fetch(`${API}/competition/participants/${COMP_ID}`,
    { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rows = await res.json();

  const onlyRegistered = rows.filter(r => r.competitionParticipantStatus === 'REGISTERED');

  if (gameSystemData.isIndividual) {
    return [...new Set(onlyRegistered.map(r => r.playerId).filter(Boolean))]; // [playerId,…]
  }
  return [...new Set(onlyRegistered.map(r => r.teamId).filter(Boolean))];      // [teamId,…]
}
