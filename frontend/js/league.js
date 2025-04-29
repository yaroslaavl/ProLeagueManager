
let API = 'http://localhost:8765';
function getAuthHeaders() {
  const token = localStorage.getItem('accToken');
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

const teamModal = document.getElementById('teamModal');
const playerModal = document.getElementById('playerModal');
const teamListEl = document.getElementById('teamList');
const playerListEl = document.getElementById('playerList');
const teamNextBtn = document.getElementById('teamNextBtn');
const playerConfBtn = document.getElementById('playerConfirmBtn');
const teamModalClose = document.getElementById('teamModalClose');
const playerModalClose = document.getElementById('playerModalClose');




  const COMP_ID = localStorage.getItem('searchedLeague');
  if (!COMP_ID) {
    console.error("League ID not found in localStorage. Redirecting...");
    location.href = 'main.html';

  }


  let currentAuthHeaders = {};


  function getAuthHeaders() {
    const token = localStorage.getItem('accToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }


  let meId = null;


  if (localStorage.accToken && localStorage.refToken) {
    refreshToken().then(setupHeaderBasedOnAuth);
  } else {
    setupHeaderBasedOnAuth();
  }

  async function refreshToken () {
    try {
      const refToken = localStorage.getItem('refToken');
      if (!refToken) return;

      const r = await fetch(`${API}/auth/refresh-token`, {
        method : 'POST',
        headers: { Authorization: `Bearer ${refToken}` }
      });
      if (!r.ok) {
        if (r.status === 401 || r.status === 403) {
          console.warn("Refresh token invalid/expired. Clearing session.");
          localStorage.clear();
          location.reload();
        } else {
          throw new Error(`Refresh token failed: ${r.status}`);
        }
        return;
      }
      const t = await r.json();
      localStorage.setItem('accToken', t.accessToken);
      localStorage.setItem('refToken', t.refreshToken);
      console.log("Token refreshed successfully.");
      currentAuthHeaders = getAuthHeaders();
    } catch (error) {
      console.warn('Token refresh process failed:', error);
    }
  }

  async function logOut () {
    localStorage.clear();
    try {
      await fetch(`${API}/auth/logout`, {
        method :'POST',
        headers: getAuthHeaders()
      });
      console.log("Logout API call successful.");
    } catch(error) {
      console.error("Logout API call failed:", error);
    } finally {
      location.href = 'main.html';
    }
  }

  function setupHeaderBasedOnAuth() {
    currentAuthHeaders = getAuthHeaders();
    if (!localStorage.accToken) {
      document.getElementById('notification_button')?.remove();
      const headerRight = document.getElementById('header_right');
      if (headerRight) {
        headerRight.innerHTML = `
              <a href="login.html">
                <div class="registerBtn"><button class="register">Zaloguj się</button></div>
              </a>`;
      }
      const feedbackInput = document.querySelector('.feedback-input');
      if(feedbackInput) feedbackInput.style.display = 'none';
    }
    const logoutBtnMenu = document.getElementById('logOut');
    if (logoutBtnMenu) {
      logoutBtnMenu.onclick = logOut;
    }
  }



  function toast (txt, err = false) {
    const wrap = document.getElementById('toastContainer') ||
      (() => {
        const d = document.createElement('div'); d.id = 'toastContainer';
        Object.assign(d.style,{ position:'fixed', right:'0px', left:'0px', bottom:'30px', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center' });
        document.body.appendChild(d); return d;
      })();
    const box = document.createElement('div');
    Object.assign(box.style,{
      background : err ? '#EA3943' : '#3861FB',
      color      : '#fff', padding:'10px 20px', marginTop:'8px', borderRadius:'8px',
      fontSize   : '14px', boxShadow:'0 2px 6px rgba(0,0,0,.2)',
      opacity    : '0', transition: 'opacity 0.5s ease', maxWidth: '350px',
      width      : 'fit-content', textAlign: 'center'
    });
    box.textContent = txt;
    wrap.prepend(box);
    setTimeout(() => { box.style.opacity = '1'; }, 10);
    setTimeout(() => { box.style.opacity = '0'; setTimeout(() => box.remove(), 500); }, 4000);
  }

  function handleFatalError(message, details = "") {
    console.error("Fatal Error:", message, details);
    const container = document.querySelector('.container');
    if (container) {
      container.innerHTML = `<div class='error-fatal'><h1>Błąd Krytyczny</h1><p>${message}</p>${details ? `<p><small>${details}</small></p>` : ''}<p><a href="main.html">Powrót do strony głównej</a></p></div>`;
    }
  }


  document.addEventListener('DOMContentLoaded', () => {
    footerTimings();
    loadEssentialLeagueData().then(success => {
      if (success) {
        loadBanner();
        loadFeedbackList();
        setupSidebar();
      }
    });


    const logoutBtn = document.getElementById('logOut');
    if (logoutBtn && !logoutBtn.onclick) {
      logoutBtn.onclick = logOut;
    }
  });


  function footerTimings () {
    const s1 = document.querySelector('.footer-content span:nth-child(3)');
    const s2 = document.querySelector('.footer-content span:nth-child(4)');
    if (!s1||!s2) return;
    window.addEventListener('load',()=>{
      setTimeout(()=>{
        if(performance && performance.timing){
          const t=performance.timing;
          const lt = t.loadEventEnd-t.navigationStart;
          const rt = t.responseEnd-t.responseStart;
          if(lt > 0 && isFinite(lt)) s1.innerHTML=`Strona: <span class="blue">${Math.round(lt)} ms</span>`;
          if(rt > 0 && isFinite(rt)) s2.innerHTML=`Szablon: <span class="blue">${Math.round(rt)} ms</span>`;
        }
      },0);
    });
  }


  async function loadBanner () {
    try {
      const url = await fetch(`${API}/competition/get-image/${COMP_ID}`, {headers: getAuthHeaders()})
        .then(r=>r.ok?r.text():null);
      const bannerImg = document.querySelector('.banner img');
      const avatarImg = document.querySelector('.avatar img');
      if (url) {
        if (bannerImg) bannerImg.src=url; else document.querySelector('.banner').style.backgroundImage = `url(${url})`;
        if (avatarImg) avatarImg.src=url;
      } else { throw new Error("Banner URL not received"); }
    } catch(error) {
      console.warn("Failed to load banner image:", error.message);
      const bannerImg = document.querySelector('.banner img');
      const avatarImg = document.querySelector('.avatar img');
      if(bannerImg) bannerImg.src = 'img/default-banner.png'; else document.querySelector('.banner').style.background = '#ccc';
      if(avatarImg) avatarImg.src = 'img/default-avatar.svg';
    }
  }

  async function getMeId () {
    if (meId !== null) return meId;
    if (!localStorage.accToken) return null;
    try {
      const response = await fetch(`${API}/user/profile`, { headers: getAuthHeaders() });
      if (!response.ok) { console.error('Ошибка при получении профиля:', response.statusText); return null; }
      const me = await response.json();
      meId = me?.id ?? null;
      return meId;
    } catch (err) { console.error('Ошибка запроса getMeId:', err); return null; }
  }


  async function loadEssentialLeagueData() {
    try {
      const comp = await fetch(`${API}/competition/all`,{headers: getAuthHeaders()})
        .then(r=>r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
        .then(a=>a.find(c=>c.id===COMP_ID));
      if (!comp) throw new Error(`League ${COMP_ID} not found.`);
      updateLeagueDetailsUI(comp);
      return true;
    } catch(error) {
      console.error("Error loading essential league data:", error);
      handleFatalError(`Błąd ładowania danych ligi: ${error.message}`);
      return false;
    }
  }

  async function updateLeagueDetailsUI(comp) {
    const bs = document.querySelector('.active-badge span');
    const bd = document.querySelector('.active-badge div');
    if(bs) bs.textContent = comp.status || 'NIEZNANY';
    if(bd) bd.style.backgroundColor = comp.status?.toUpperCase() === 'ACTIVE' ? 'green' : 'gray';

    const regBtn = document.querySelector('.register-btn');
    if(regBtn) {
      try {
        const participating = await userParticipates();
        const canRegister = !['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(comp.status?.toUpperCase()) && !participating;
        regBtn.style.display = canRegister ? 'block' : 'none';
        if(canRegister) regBtn.onclick = () => openRegistration(comp);
      } catch(e) {
        console.error("Error checking participation for reg button:", e);
        regBtn.style.display = 'none';
      }
    }

    const tnStrong = document.querySelector('.tournament-name strong');
    if(tnStrong) tnStrong.textContent = comp.name || 'Bezimienna Liga';

    let sportName = '?';
    try {
      const sport = await fetch(`${API}/sport/id/${comp.sportId}`,{headers: getAuthHeaders()}).then(r=>r.ok ? r.json() : {name:'?'});
      sportName = sport.name;
    } catch { sportName = 'Błąd!'; }
    const tnSpan = document.querySelector('.tournament-name span');
    const detailSport = document.querySelector('[data-field="sport"]');
    if(tnSpan) tnSpan.textContent = sportName;
    if(detailSport) detailSport.textContent = sportName;


    const modeStr = (comp.name?.match(/(\d+v?s\d+)/i)||['?'])[0].replace(/vs/i,' v ');
    const detailMode = document.querySelector('[data-field="mode"]');
    if(detailMode) detailMode.textContent = modeStr;

    const detailCount = document.querySelector('[data-field="count"]');
    if(detailCount) updateLeagueCountDisplay(comp);

    const dateStr = comp.startDate ? new Date(comp.startDate).toLocaleDateString('pl-PL') : '?';
    const detailDate = document.querySelector('[data-field="date"]');
    if(detailDate) detailDate.textContent = dateStr;


    const fb=document.querySelector('.feedback-input');
    if(fb){
      try {
        if(await userParticipates()){
          fb.style.display='flex';
          const inp=fb.querySelector('input'), btn=fb.querySelector('button');
          btn.disabled = !(inp.value.trim());
          inp.oninput=()=>btn.disabled=!inp.value.trim();
          btn.onclick=()=>sendFeedback(inp,btn);
        } else {
          fb.style.display='none';
        }
      } catch (e) {
        console.error("Error setting up feedback input:", e);
        fb.style.display = 'none';
      }
    }
  }

  async function updateLeagueCountDisplay(comp) {
    const detailCount = document.querySelector('[data-field="count"]');
    if(!detailCount) return;
    detailCount.textContent = '... / ...';
    let playersPerSide = '?'; let currentCount = '?';
    try{
      const gs = await fetch(`${API}/game-system/get/${comp.gameSystemId}`, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : {});
      playersPerSide = gs?.maxTeamSize ?? '?';
    } catch { console.warn("Failed to get GS for count");}
    try {
      const table = await fetch(`${API}/competition/league-table/${COMP_ID}`, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : []);
      currentCount = Array.isArray(table) ? table.length : 0;
    } catch { console.warn("Failed to get league table for count");}
    detailCount.textContent = `${currentCount} / ${playersPerSide}`;
  }


  async function competitionIsIndividual(comp) {

    const gs = await fetchGameSystem(comp.gameSystemId);
    if (!gs) return false;


    if (typeof gs.isIndividual === 'boolean') return gs.isIndividual;


    const min = +(gs.minTeamSize    ?? gs.playersPerTeam ?? 1);
    const max = +(gs.maxTeamSize    ?? gs.playersPerTeam ?? 1);


    return min === 1 && max === 1;
  }
  async function openRegistration(comp) {
    const headers = getAuthHeaders();
    const isInd   = await competitionIsIndividual(comp);


    if (isInd) {
      if (!await getMeId()) { toast('Zaloguj się, aby dołączyć.', true); return; }
      if (!confirm('Dołączyć do zawodów?')) return;

      try {
        const resp = await fetch(
          `${API}/competition/participation?competitionId=${COMP_ID}`,
          { method: 'POST', headers }
        );
        const js = await resp.json().catch(()=>({}));
        if (!resp.ok) throw new Error(js.message || `HTTP ${resp.status}`);

        toast('Zarejestrowano ✅');
        closeAllModals?.();
        await loadEssentialLeagueData();
      } catch (e) { toast(e.message || 'Błąd rejestracji', true); }
      return;
    }


    try {
      await renderTeamList();
      teamModal.classList.remove('hidden');
    } catch (e) {
      console.error(e);
      toast('Problem z pobraniem drużyn', true);
    }
  }



  let _selectedTeam  = null;
  let _selectedPlayers = [];


  if(teamModalClose) teamModalClose.onclick = closeAllModals;
  if(playerModalClose) playerModalClose.onclick = closeAllModals;

  async function renderPlayerList(team) {
    if (!playerListEl || !playerConfBtn || !team) return;

    playerListEl.textContent      = `Ładowanie ${team.teamName}…`;
    playerConfBtn.disabled        = true;
    _selectedPlayers              = [];

    try {
      const info = await fetch(
        `${API}/team/currentTeam/${encodeURIComponent(team.teamName)}`,
        { headers: getAuthHeaders() }
      ).then(r => r.ok ? r.json() : { members: [] });

      if (!info.members?.length) {
        playerListEl.textContent = 'Brak składu.';
        return;
      }


      let reqP = 1, maxP = info.members.length;
      try {
        const comp = await fetch(`${API}/competition/all`,
          { headers: getAuthHeaders() })
          .then(r => r.json())
          .then(arr => arr.find(c => c.id === COMP_ID));

        if (comp?.gameSystemId) {
          const gs = await fetchGameSystem(comp.gameSystemId);
          reqP = +(gs.playersPerTeam ?? gs.minTeamSize ?? 1);
          maxP = +(gs.maxTeamSize    ?? info.members.length);
        }
      } catch {  }

      playerListEl.innerHTML =
        `<div>Wybierz graczy (${reqP}-${maxP}):</div>`;


      const avatarPromises = info.members.map(async m => {
        const user   = await fetch(`${API}/user/getUser/${m.userId}`,
          { headers: getAuthHeaders() })
          .then(r => r.ok ? r.json() : { username: `#${m.userId}` });

        const avatar = await fetch(`${API}/user/avatar/${user.username}`,
          { headers: getAuthHeaders() })
          .then(r => r.ok ? r.text() : 'img/profile.svg')
          .catch(() => 'img/profile.svg');

        const div = document.createElement('div');
        div.className = 'reg-modal__item';
        div.innerHTML = `
        <div class="reg-modal__item-left">
          <div class="reg-modal__avatar">
            <img src="${avatar}" width="30" height="30" style="border-radius:50%">
          </div>
          <span>${user.username}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <time style="font-size:12px;color:#666">
            ${m.createdAt ? new Date(m.createdAt).toLocaleDateString('pl-PL') : ''}
          </time>
          <input type="checkbox" value="${m.userId}">
        </div>`;


        div.querySelector('input[type="checkbox"]').onchange =
          () => updatePlayerSelectState(reqP, maxP);

        playerListEl.appendChild(div);
      });

      await Promise.all(avatarPromises);

    } catch { playerListEl.textContent = 'Błąd.'; }
  }

  async function onTeamNext() { if (!_selectedTeam || !playerModal) return; if(teamModal) teamModal.classList.add('hidden'); await renderPlayerList(_selectedTeam); playerModal.classList.remove('hidden'); }
  if (teamNextBtn) teamNextBtn.onclick = onTeamNext;



  async function onPlayersConfirm () {
    if (!_selectedTeam || !_selectedPlayers.length) return;



    const url = new URL(`${API}/competition/participation`);
    url.searchParams.append('competitionId', COMP_ID);
    url.searchParams.append('teamId',       _selectedTeam.id);
    _selectedPlayers.forEach(id => url.searchParams.append('selectedPlayersIds', id));

    try {
      const r = await fetch(url, { method:'POST', headers:getAuthHeaders() });
      const j = await r.json().catch(()=> ({}));
      if (!r.ok) throw new Error(j.message || `HTTP ${r.status}`);
      toast('Drużyna zgłoszona! ✅');
      closeAllModals();
      await loadEssentialLeagueData();
    } catch (e) { toast(e.message || 'Błąd rejestracji', true); }
  }
  if (playerConfBtn) playerConfBtn.onclick = onPlayersConfirm;



  async function sendFeedback (inp, btn) {  const txt=inp.value.trim();if(!txt)return;try{const r=await fetch(`${API}/feedback/create/${COMP_ID}`,{method:'POST',headers:{'Content-Type':'application/json',...getAuthHeaders()},body:JSON.stringify({message:txt})});const res=await r.json().catch(()=>({message:'OK'}));if(!r.ok)throw new Error(res.message);toast('Wysłano');inp.value='';btn.disabled=true;loadFeedbackList();}catch(e){toast(e.message||'Błąd',true);}}
  async function loadFeedbackList () {  const wrap=document.querySelector('.feedback');if(!wrap)return;wrap.querySelectorAll('.comment').forEach(n=>n.remove());const myId=await getMeId();const rows=await fetch(`${API}/feedback/get-by-competition?competitionId=${COMP_ID}`,{headers:getAuthHeaders()}).then(r=>r.ok?r.json():[]);const toneEmoji={'very positive':'😍',positive:'😊',neutral:'😐',negative:'😕','very negative':'😡'};for(const row of rows){const u=await fetch(`${API}/user/getUser/${row.userId}`,{headers:getAuthHeaders()}).then(r=>r.json());const av=await fetch(`${API}/user/avatar/${u.username}`,{headers:getAuthHeaders()}).then(r=>r.text()).catch(()=>'img/profile.svg');const when=new Date(row.createdAt).toLocaleString('pl-PL',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'});const card=document.createElement('div');card.className='comment';card.dataset.id=row.id;card.innerHTML=`<div class="comment-header"><div class="avatar-comment"><img src="${av}" style="width:35px;height:35px;border-radius:50%"></div><span>${u.username}</span><span class="timestamp">${when}</span>${myId===row.userId?'<button class="fb-del" style="background:none;border:none;font-size:18px;cursor:pointer">🗑️</button>':''}</div><p style="margin:10px 0 0 45px">${row.message}</p><div class="comment-reactions"><span style="font-size:20px">${toneEmoji[row.tonality?.toLowerCase()]||'😐'}</span><button class="fb-like"><img src="img/thumbs-up.svg" style="width:20px;height:20px"><span>${row.likes}</span></button></div>`;wrap.appendChild(card);}wrap.querySelectorAll('.fb-like').forEach(b=>b.onclick=async e=>{e.stopPropagation();const id=b.closest('.comment').dataset.id;try{await fetch(`${API}/feedback/like/${id}`,{method:'PUT',headers:getAuthHeaders()});const s=b.querySelector('span');s.textContent=+s.textContent+1;}catch{toast('Błąd',true);}});wrap.querySelectorAll('.fb-del').forEach(b=>b.onclick=async e=>{e.stopPropagation();if(!confirm('Usunąć?'))return;const id=b.closest('.comment').dataset.id;try{await fetch(`${API}/feedback/delete/${id}`,{method:'DELETE',headers:getAuthHeaders()});b.closest('.comment').remove();toast('Usunięto');}catch{toast('Błąd',true);}});}
  async function handleLikeClick(e){ e.stopPropagation();const btn=e.currentTarget;if(!await getMeId()){toast('Zaloguj się.',true);return;}const c=btn.closest('.comment');if(!c)return;const id=c.dataset.id;btn.disabled=true;try{const r=await fetch(`${API}/feedback/like/${id}`,{method:'PUT',headers:getAuthHeaders()});if(r.ok){const s=btn.querySelector('span');s.textContent=parseInt(s.textContent)+1;toast('Polubiono');}else{toast(`Błąd: ${r.statusText}`,true);btn.disabled=false;}}catch(e){toast("Błąd sieci.",true);btn.disabled=false;}}
  async function handleDeleteClick(e){ e.stopPropagation();const btn=e.currentTarget;if(!confirm('Usunąć?'))return;const c=btn.closest('.comment');if(!c)return;const id=c.dataset.id;btn.disabled=true;try{const r=await fetch(`${API}/feedback/delete/${id}`,{method:'DELETE',headers:getAuthHeaders()});if(r.ok){c.remove();toast('Usunięto');}else{toast(`Błąd: ${r.statusText}`,true);btn.disabled=false;}}catch(e){toast("Błąd sieci.",true);btn.disabled=false;}}



  async function fetchParticipant (playerId, teamId) {
    const headers = getAuthHeaders();


    if (playerId) {
      try {
        const u   = await fetch(`${API}/user/getUser/${playerId}`, { headers }).then(r => r.json());
        const img = await fetch(`${API}/user/avatar/${u.username}`, { headers })
          .then(r => r.text())
          .catch(() => 'img/profile.svg');
        return { type: 'player', name: u.username, img, username: u.username, id: playerId };
      } catch {
        return { type: 'player', name: `Gracz #${playerId}`, img: 'img/profile.svg', username: `Gracz #${playerId}`, id: playerId };
      }
    }


    if (teamId) {
      try {

        const meta     = await fetch(`${API}/team/current/${teamId}`, { headers })
          .then(r => r.ok ? r.json() : null);
        const teamName = meta?.teamName || `Drużyna #${teamId}`;

        const img = await fetch(`${API}/team/team-logo/${teamId}`, { headers })
          .then(r => r.ok ? r.text() : 'img/default-team-avatar.png')
          .catch(() => 'img/default-team-avatar.png');

        return { type: 'team', name: teamName, img, teamName, id: teamId };
      } catch {
        return { type: 'team', name: `Drużyna #${teamId}`, img: 'img/default-team-avatar.png', teamName: `Drużyna #${teamId}`, id: teamId };
      }
    }


    return { type: 'unknown', name: '—', img: 'img/default-team-avatar.png', id: null };
  }

  function linkToProfile(p){if(p.type==='player')return`open-profile.html" onclick="localStorage.setItem('searchedProfile','${p.username}')`;if(p.type==='team')return`public-teamPage.html" onclick="localStorage.setItem('searchedTeam','${p.teamName}')`;return'#" onclick="return false';}
  const nameHTML=p=>`<a href="${linkToProfile(p)}" style="color:inherit;text-decoration:none"><strong>${p.name}</strong></a>`;
  const arrowHTML=p=>`<a href="${linkToProfile(p)}"><img src="img/chevron-right.svg" style="width:18px;height:18px"></a>`;


  async function loadTeams () {
    const list = document.querySelector('.match-list'); if(!list) return; list.innerHTML = '<div class="loading-placeholder">Ładowanie...</div>'; list.style.display = 'block'; try {const tbl = await fetch(`${API}/competition/league-table/${COMP_ID}`, {headers: getAuthHeaders()}).then(r=>r.ok?r.json():[]); const arr = await Promise.all(tbl.map(r => fetchParticipant(r.playerId, r.teamId))); arr.sort((a,b) => a.name.localeCompare(b.name, 'pl-PL')); list.innerHTML = ''; arr.forEach(p => { list.insertAdjacentHTML('beforeend', `<div class="match participant-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-bottom: 1px solid #eee; width: auto;  margin-bottom: 10px;border-radius: 10px;height: 50px"><div class="team-details" style="width: auto; padding: 0; display: flex; align-items: center; gap: 10px;" ><img src="${p.img}" style="width:32px;height:32px;border-radius:50%; object-fit: cover;">${nameHTML(p)}</div>${arrowHTML(p)}</div>`); }); } catch (e) { list.innerHTML = '<div class="error-placeholder">Błąd ładowania uczestników.</div>'; }
  }
  async function loadTop () {
    const list = document.querySelector('.match-list'); if(!list) return; list.innerHTML = '<div class="loading-placeholder">Ładowanie...</div>'; list.style.display = 'block'; try { const tbl = await fetch(`${API}/competition/league-table/${COMP_ID}`, {headers: getAuthHeaders()}).then(r=>r.ok?r.json():[]); tbl.sort((a,b) => (b.wins*3 + b.draws) - (a.wins*3 + a.draws) || b.wins - a.wins); list.innerHTML = ''; for (const [index, row] of tbl.entries()) { const p = await fetchParticipant(row.playerId, row.teamId); list.insertAdjacentHTML('beforeend', `<div class="match top-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; width: auto; background: white; border-radius: 10px; margin-bottom: 15px;"><div class="team-details" style="width: auto; padding: 0; display: flex; align-items: center; gap: 10px; flex-grow: 1;"><img src="${p.img}" style="width:35px;height:35px;border-radius:50%; object-fit: cover;">${nameHTML(p)}</div><div class="team-place" style="display: flex; align-items: center; gap: 8px; margin-left: 20px; flex-shrink: 0;"><span>Miejsce:</span><strong style="font-size: 1.1em;">${index + 1}</strong></div><div class="team-victories" style="display: flex; align-items: center; gap: 8px; margin-left: 20px; flex-shrink: 0;"><span>Punkty:</span><strong style="font-size: 1.1em;">${row.wins*3 + row.draws}</strong></div><div class="team-victories" style="display: flex; align-items: center; gap: 8px; margin-left: 20px; flex-shrink: 0;"><span>Zwycięstwa:</span><strong style="font-size: 1.1em;">${row.wins}</strong></div><div style="margin-left: 20px;">${arrowHTML(p)}</div></div>`); } } catch (e) { list.innerHTML = '<div class="error-placeholder">Błąd ładowania rankingu.</div>';}
  }


  let totalR = 1, curR = 1;

  async function setupMatches () {
    try {
      const tbl = await fetch(`${API}/competition/league-table/${COMP_ID}`, {headers: getAuthHeaders()}).then(r=>r.ok?r.json():[]);
      const participantCount = tbl.length;
      totalR = participantCount > 1 ? participantCount - 1 : 1;
      curR   = 1;
      renderRoundCtrls();
      renderRound();
    } catch (error) {
      console.error("Failed to setup matches:", error);
      const list = document.querySelector('.match-list');
      if (list) list.innerHTML = '<div class="error-placeholder">Błąd inicjalizacji meczów.</div>';
      document.querySelector('.round-controls')?.remove();
    }
  }

  function renderRoundCtrls () {
    document.querySelector('.round-controls')?.remove();
    const head = document.querySelector('.match-header');
    if (!head) return;
    const box  = document.createElement('div');
    box.className = 'round-controls';
    Object.assign(box.style, {marginLeft:'auto', display:'flex', gap:'8px', alignItems:'center'});
    const mk = txt => { const b = document.createElement('button'); b.textContent = txt; b.className = 'round-ctrl-btn'; return b; };
    const prev = mk('‹'), next = mk('›'), span = document.createElement('span');
    span.className = 'round-indicator';
    const upd = () => { span.textContent = `Tura ${curR}/${totalR}`; prev.disabled = curR === 1; next.disabled = curR === totalR; };
    prev.onclick = () => { if (curR > 1) { curR--; upd(); renderRound(); } };
    next.onclick = () => { if (curR < totalR) { curR++; upd(); renderRound(); } };
    upd(); box.append(prev, span, next); head.appendChild(box);
  }

  async function renderRound () {
    const list = document.querySelector('.match-list');
    if (!list) return;
    list.innerHTML = '<div class="loading-placeholder">Ładowanie meczów...</div>';
    list.style.display = 'block';

    try {
      const r = await fetch(`${API}/match/tourMatches/${COMP_ID}?leagueTourNumber=${curR}`, { headers: getAuthHeaders() });
      if (!r.ok) { list.innerHTML = `<div class="info-placeholder">Brak meczów w turze ${curR}.</div>`; return; }
      const arr = await r.json();
      if (!Array.isArray(arr) || arr.length === 0) { list.innerHTML = `<div class="info-placeholder">Brak meczów w turze ${curR}.</div>`; return; }

      list.innerHTML = '';
      list.insertAdjacentHTML('beforeend', `<div class="match-list-header"><div><span>Start:</span></div><div><span>Gra:</span></div><div><span>Status:</span></div></div>`);

      const participantPromises = arr.map(m => Promise.all([fetchParticipant(m.playerAId, m.teamAId), fetchParticipant(m.playerBId, m.teamBId)]));
      const participantsData = await Promise.all(participantPromises);

      arr.forEach((m, index) => {
        const dt = m.matchDate ? new Date(m.matchDate) : null;
        const timeStr = dt ? dt.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}) : 'TBD';
        const dateStr = dt ? dt.toLocaleDateString('pl-PL') : '';
        const [L, R] = participantsData[index];
        let scoreClassA = '', scoreClassB = '';

        if (['FINISHED', 'AUTO_WIN', 'WALKOVER'].includes(m.matchStatus)) {
          const winnerId = m.winnerPlayerId ?? m.winnerTeamId; const pAId = m.playerAId ?? m.teamAId; const pBId = m.playerBId ?? m.teamBId;
          if (winnerId && winnerId === pAId) { scoreClassA = 'match-winner'; scoreClassB = 'match-loser'; }
          else if (winnerId && winnerId === pBId) { scoreClassB = 'match-winner'; scoreClassA = 'match-loser'; }
          else if (m.scoreA !== null && m.scoreB !== null) { if (m.scoreA > m.scoreB) { scoreClassA = 'match-winner'; scoreClassB = 'match-loser'; } else if (m.scoreB > m.scoreA) { scoreClassB = 'match-winner'; scoreClassA = 'match-loser'; } }
        }

        list.insertAdjacentHTML('beforeend', `
              <div class="match match-item" data-match-id="${m.id}">
                  <div class="match-time">
                      <strong>${timeStr}</strong>
                      <span> ${dateStr}</span>
                  </div>
                  <div class="team-details">
                      <strong class="${scoreClassA}">${nameHTML(L)}</strong>
                      <img src="${L.img}" alt="">
                      <strong>${m.scoreA ?? '—'} : ${m.scoreB ?? '—'}</strong>
                      <img src="${R.img}" alt="">
                      <strong class="${scoreClassB}">${nameHTML(R)}</strong>
                  </div>
                  <div class="match-stage">
                      <strong>${m.matchStatus || '?'}</strong>
                  </div>
              </div>`);
      });
    } catch (error) {
      console.error("Error rendering round:", error);
      list.innerHTML = '<div class="error-placeholder">Błąd ładowania meczów.</div>';
    }
  }


  function setupSidebar () {
    const [btnTeams, btnGames, btnTop] = document.querySelectorAll('.sidebar button');
    const h = document.querySelector('.match-header h3');
    const listContainer = document.querySelector('.match-list');

    const act = (b, title, callback) => {
      document.querySelectorAll('.sidebar button').forEach(x => x.classList.toggle('active', x === b));
      if (h) h.textContent = title;
      document.querySelector('.round-controls')?.remove();
      if(listContainer) listContainer.style.display = 'block';
      const headerEl = listContainer?.querySelector('.match-list-header');
      if(headerEl) headerEl.style.display = (b === btnGames) ? 'grid' : 'none';

      callback();
    }



    const currentlyActive = document.querySelector('.sidebar button.active');
    if (currentlyActive === btnTeams) {
      act(btnTeams, 'Uczestnicy:', loadTeams);
    } else if (currentlyActive === btnGames) {
      act(btnGames, 'Mecze:', setupMatches);
    } else {
      act(btnTop, 'Top:', loadTop);
    }



    btnTeams.onclick = () => { act(btnTeams, 'Uczestnicy:', loadTeams); };
    btnGames.onclick = () => { act(btnGames, 'Mecze:', setupMatches); };
    btnTop.onclick = () => { act(btnTop, 'Top:', loadTop); };
  }



  async function userParticipates () {
    const uid = await getMeId(); if (!uid) return false;
    try {
      const tbl = await fetch(`${API}/competition/league-table/${COMP_ID}`, {headers: getAuthHeaders()}).then(r=>r.ok?r.json():[]);
      const myTeams = await fetch(
        `${API}/team/managed?id=${uid}`, { headers: getAuthHeaders() }
      ).then(r => r.ok ? r.json() : []).then(a => a.map(t => t.id));
      return tbl.some(r => r.playerId === uid || (r.teamId && myTeams.includes(r.teamId)));
    } catch { return false; }
  }


  function footerMetrics() {
    const s1 = document.querySelector('.footer-content span:nth-child(3)'); const s2 = document.querySelector('.footer-content span:nth-child(4)'); if (!s1 || !s2) return; window.addEventListener('load', () => setTimeout(() => { if (performance && performance.timing) { const t = performance.timing; const lT = t.loadEventEnd - t.navigationStart; const tT = t.responseEnd - t.responseStart; if (lT > 0 && isFinite(lT)) { s1.innerHTML = `Strona: <span class="blue">${Math.round(lT)}ms</span>`; } if (tT > 0 && isFinite(tT)) { s2.innerHTML = `Szablon: <span class="blue">${Math.round(tT)}ms</span>`; } } }, 0));
  }



document.addEventListener('click', e => {
  const card = e.target.closest('.match-item[data-match-id]');
  if (!card) return;
  const matchId = card.dataset.matchId;
  if (!matchId) return;

  localStorage.setItem('searchedMatch', matchId);
  window.location.href = 'match-page.html';
});

window.closeAllModals = closeAllModals;
function closeAllModals() {
  if(teamModal) teamModal.classList.add('hidden');
  if(playerModal) playerModal.classList.add('hidden');
  if(teamListEl) teamListEl.innerHTML = '';
  if(playerListEl) playerListEl.innerHTML = '';
  if(teamNextBtn) teamNextBtn.disabled = true;
  if(playerConfBtn) playerConfBtn.disabled = true;
  _selectedTeam = null; _selectedPlayers = [];
}
const _gsCache = new Map();

async function fetchGameSystem(gameSystemId) {
  if (_gsCache.has(gameSystemId)) return _gsCache.get(gameSystemId);

  const gs = await fetch(`${API}/game-system/get/${gameSystemId}`,
    { headers: getAuthHeaders() })
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null);

  _gsCache.set(gameSystemId, gs);
  return gs;
}
function updatePlayerSelectState(reqP, maxP) {
  _selectedPlayers = [...playerListEl.querySelectorAll('input:checked')]
    .map(ch => ch.value);

  const ok = _selectedPlayers.length >= reqP &&
    _selectedPlayers.length <= maxP;

  playerConfBtn.disabled = !ok;


  playerListEl.querySelectorAll('input:not(:checked)')
    .forEach(ch => ch.disabled = _selectedPlayers.length >= maxP);
}
const $ = id => document.getElementById(id);
async function renderTeamList () {
  const listEl  = $('teamList');
  const nextBtn = $('teamNextBtn');
  if (!listEl || !nextBtn) return;

  teamListEl.textContent = 'Ładowanie…';
  teamNextBtn.disabled   = true;
  _selectedTeam          = null;

  try {
    const meId = await getMeId();
    if (!meId) { teamListEl.textContent = 'Musisz być zalogowany.'; return; }

    const res   = await fetch(`${API}/team/managed?id=${meId}`,
      { headers: getAuthHeaders() });
    const teams = res.ok ? await res.json() : [];
    if (!teams.length) { teamListEl.textContent = 'Brak drużyn.'; return; }

    teamListEl.innerHTML = '';
    for (const t of teams) {
      const logo = await fetch(`${API}/team/team-logo/${t.id}`,
        { headers:getAuthHeaders() })
        .then(r => r.ok ? r.text() : 'img/default-team-avatar.png')
        .catch(() => 'img/default-team-avatar.png');

      teamListEl.insertAdjacentHTML('beforeend', `
        <label class="reg-modal__item">
          <div class="reg-modal__item-left">
            <div class="reg-modal__avatar">
              <img src="${logo}" width="30" height="30" style="border-radius:50%">
            </div>
            <span>${t.teamName}</span>
          </div>
          <input type="radio" name="teamSelection"
                 value="${t.id}" data-team-name="${t.teamName}">
        </label>`);
    }
    window.getMeId = getMeId;


    teamListEl.querySelectorAll('input[name="teamSelection"]')
      .forEach(r =>
        r.onchange = () => {
          _selectedTeam      = { id: r.value, teamName: r.dataset.teamName };
          teamNextBtn.disabled = false;
        });

  } catch (err) {
    console.error(err);
    teamListEl.textContent = 'Błąd ładowania.';
  }
}
