
document.addEventListener("DOMContentLoaded", () => {
  const pageLoadSpan = document.querySelector(".footer-content span:nth-child(3)");
  const htmlLoadSpan = document.querySelector(".footer-content span:nth-child(4)");

  if (pageLoadSpan && htmlLoadSpan) {

    window.addEventListener("load", () => {
      setTimeout(() => {
        const performanceTiming = performance.timing;
        const pageLoadTime = performanceTiming.loadEventEnd - performanceTiming.navigationStart;
        const htmlLoadTime = performanceTiming.responseEnd - performanceTiming.responseStart;
        const validPageLoadTime = pageLoadTime > 0 ? pageLoadTime : performance.now();
        const validHtmlLoadTime = htmlLoadTime > 0 ? htmlLoadTime : 0;
        pageLoadSpan.innerHTML = `Strona: <span class="blue">${Math.round(validPageLoadTime)}ms</span>`;
        htmlLoadSpan.innerHTML = `Szablon: <span class="blue">${Math.round(validHtmlLoadTime)}ms</span>`;
        console.log("Page Load Time (ms):", validPageLoadTime);
        console.log("HTML Load Time (ms):", validHtmlLoadTime);
      }, 0);
    });
  }
});
document.addEventListener('DOMContentLoaded', () => {

  const searchedUsername = localStorage.getItem('searchedProfile');
  if (!searchedUsername) {
    console.warn('Нет searchedProfile в localStorage!');
    window.location.href = 'main.html';
    return;
  }


  loadPublicUserData(searchedUsername);

});


async function loadPublicUserData(username) {
  try {

    const response = await fetch(`http://localhost:8765/user/profile/public/${username}`, {
      method: 'GET'
    });
    if (!response.ok) {
      throw new Error(`Ошибка при запросе публичного профиля: ${response.status}`);
    }

    const data = await response.json();
    console.log('Публичные данные пользователя:', data);












    document.getElementById('first_last_name').textContent = `${data.firstName} ${data.lastName}`;
    document.getElementById('nickname').textContent = data.username;


    if (data.birthDate) {
      const [yyyy, mm, dd] = data.birthDate.split('-');
      document.getElementById('date_of_birth').textContent = `${dd}.${mm}.${yyyy}`;
    }

    if (data.createdAt) {
      const dateObj = new Date(data.createdAt);
      document.getElementById('creation-date').textContent = dateObj.toLocaleDateString();
    }

    if (data.avatar) {
      document.getElementById('profile_img').src = data.avatar;
    }


    if (data.id) {
      loadPublicUserTeamsByUserId(data.id);
      initPublicTabs(data.id);
    }

  } catch (err) {
    console.error('Ошибка при загрузке публичного профиля:', err);


  }
}


async function loadPublicUserTeamsByUserId(userId) {
  try {
    const url = `http://localhost:8765/team/get-teams-by-userId?userId=${userId}`;
    const response = await fetch(url, {
      method: 'GET'


    });
    if (!response.ok) {
      console.warn('Не удалось загрузить команды публичного пользователя');
      return;
    }

    const teams = await response.json();
    console.log('Команды пользователя (public):', teams);

    const teamsContainer = document.getElementById('teams-container');
    teamsContainer.innerHTML = '';

    if (!teams || teams.length === 0) {

      return;
    }


    for (const team of teams) {

      const teamEl = document.createElement('div');
      teamEl.classList.add('teams');


      const teamImg = document.createElement('img');
      teamImg.alt = 'Team_avatar';

      try {
        const logoResponse = await fetch(`http://localhost:8765/team/team-logo/${team.id}`);
        if (logoResponse.ok) {
          teamImg.src = await logoResponse.text();
        } else {
          teamImg.src = 'img/default-team-avatar.png';
        }
      } catch (err) {
        console.error('Ошибка при загрузке логотипа команды:', err);
        teamImg.src = 'img/default-team-avatar.png';
      }



      const teamNameLink = document.createElement("a");
      teamNameLink.href = "public-teamPage.html";
      teamNameLink.textContent = team.teamName;
      teamNameLink.style.color = "#000000";
      teamNameLink.style.fontWeight = "bold";

      teamNameLink.addEventListener("click", () => {
        localStorage.setItem("searchedTeam", team.teamName);
      });



      const roleP = document.createElement('p');
      roleP.textContent = 'Ładowanie ról...';


      teamEl.appendChild(teamImg);
      teamEl.appendChild(teamNameLink);
      teamEl.appendChild(roleP);

      teamsContainer.appendChild(teamEl);


      try {

        const roleUrl = `http://localhost:8765/team/get-team-member-by-team-and-userId?teamId=${team.id}&userId=${userId}`;
        const roleResp = await fetch(roleUrl, { method: 'GET' });
        if (roleResp.ok) {
          const roleData = await roleResp.json();









          if (roleData.roles && roleData.roles.length > 0) {
            const rolesText = roleData.roles.map(r => r.name).join(', ');
            roleP.textContent = rolesText;
          } else {
            roleP.textContent = 'Brak ról';
          }
        } else {
          console.warn(`Не удалось загрузить роли для teamId=${team.id}, userId=${userId}`);
          roleP.textContent = 'Brak danych o rolach';
        }
      } catch (err) {
        console.error(`Ошибка при запросе ролей teamId=${team.id}, userId=${userId}:`, err);
        roleP.textContent = 'Błąd wczytywania ról';
      }
    }
  } catch (err) {
    console.error('Ошибка при загрузке публичных команд:', err);
  }
}




function logOut() {
  localStorage.clear();
  window.location.href = 'main.html';
}
async function safeJson(res) {
  if (res.status === 204 || res.status === 205) return [];
  const txt = await res.text();
  return txt.trim() ? JSON.parse(txt) : [];
}


const gridMatch = '120px 1fr 70px';
const gridComp  = '45px 1fr 80px 130px';

function fetchPublicMatches(userId) {
  return fetch(`http://localhost:8765/match/user?userId=${userId}`)
    .then(safeJson);
}
function fetchPublicCompetitions(userId, type) {
  return fetch(
    `http://localhost:8765/competition/user?userId=${userId}&competitionType=${type}`)
    .then(safeJson);
}


function renderPublicMatches(list) {
  const title = document.querySelector('.content-placeholder .title');
  const cols  = document.querySelector('.content-placeholder .columns');
  const body  = document.getElementById('teams-container');

  title.textContent = 'Mecze';
  cols.innerHTML = `<span>Data</span><span>Status</span><span>Wynik</span>`;
  Object.assign(cols.style, {display:'grid',gridTemplateColumns:gridMatch,gap:'20px'});

  if (!list.length) {
    body.innerHTML = '<p style="padding:20px 0;">Brak danych</p>';
    return;
  }


  body.innerHTML = list.map(m => {

    const matchId = m.id ?? m.matchId ?? m.stageId ?? m.nextMatchId;

    const score   = `${m.scoreA ?? 0}:${m.scoreB ?? 0}`;
    return `
      <div class="public-match-row" data-id="${matchId ?? ''}"
           style="display:grid;grid-template-columns:${gridMatch};
                  gap:20px;align-items:center;padding:10px;margin:10px 0;
                  background:#fff;border-radius:12px;cursor:${matchId ? 'pointer':'default'}">
        <span style="font-weight:bold;color:#000000">${m.matchDate?.slice(0,10) || '-'}</span>
        <span>${m.matchStatus}</span>
        <span style="font-weight:bold;color:#000000">${score}</span>
      </div>`;}).join('');


  body.querySelectorAll('.public-match-row').forEach(row=>{
    const id = row.dataset.id;
    if (!id) return;

    row.addEventListener('click', () => {
      localStorage.setItem('searchedMatch', id);
      location.href = 'match-page.html';
    });
  });
}


async function renderPublicCompetitions(list, type) {
  const title = document.querySelector('.content-placeholder .title');
  const cols  = document.querySelector('.content-placeholder .columns');
  const body  = document.getElementById('teams-container');

  title.textContent = type === 'LEAGUE' ? 'Ligi' : 'Turnieje';
  cols.innerHTML   = `<span>Baner</span><span>Nazwa</span><span>Status</span><span>Od&nbsp;/&nbsp;Do</span>`;
  Object.assign(cols.style, {display:'grid',gridTemplateColumns:gridComp,gap:'20px'});

  if (!list.length) {
    body.innerHTML = '<p style="padding:20px 0;">Brak danych</p>';
    return;
  }

  body.innerHTML = list.map(c=>`
    <div class="public-comp-row" data-id="${c.id}"
         style="display:grid;grid-template-columns:${gridComp};
                gap:20px;align-items:center;padding:10px;margin:10px 0;
                background:#fff;border-radius:12px;cursor:pointer">
      <img class="comp-banner" style="width:45px;height:45px;border-radius:12px;
           object-fit:cover" src="" alt="banner">
      <span style="font-weight:bold;color: #000000">${c.name}</span>
      <span style="font-weight: bold">${c.status}</span>
      <span style="font-weight:bold;color: #000000">${c.startDate.slice(0,10)} ➜ ${c.endDate.slice(0,10)}</span>
    </div>`).join('');


  await Promise.all(list.map(async c=>{
    try{
      const res = await fetch(`http://localhost:8765/competition/get-image/${c.id}`);
      const url = res.ok ? await res.text() : null;
      const img = body.querySelector(`.public-comp-row[data-id="${c.id}"] .comp-banner`);
      if (url && img) img.src = url;
    }catch(e){}
  }));


  body.querySelectorAll('.public-comp-row').forEach(row=>{
    const id = row.dataset.id;
    row.addEventListener('click',()=>{
      if (type==='LEAGUE') {
        localStorage.setItem('searchedLeague', id);
        location.href = 'leagues.html';
      } else {
        localStorage.setItem('searchedTournament', id);
        location.href = 'tournaments.html';
      }
    });
  });
}


function initPublicTabs(userId) {

  async function handleTab(e){
    const txt = e.target.textContent.trim();
    document.querySelectorAll('.profile-tabs .tab')
      .forEach(t=>t.classList.toggle('active',t===e.target));

    if      (txt==='Mecze')   renderPublicMatches(await fetchPublicMatches(userId));
    else if (txt==='Ligi')    renderPublicCompetitions(await fetchPublicCompetitions(userId,'LEAGUE'),'LEAGUE');
    else if (txt==='Turnieje')renderPublicCompetitions(await fetchPublicCompetitions(userId,'TOURNAMENT'),'TOURNAMENT');
    else if (txt==='Drużyny') {
      document.querySelector('.content-placeholder .title').textContent = 'Drużyny';
      document.querySelector('.content-placeholder .columns').innerHTML =
        '<p>Zdjęcie:</p><p>Nazwa:</p><p>Role:</p>';
      document.getElementById('teams-container').innerHTML = '';
      loadPublicUserTeamsByUserId(userId);
    }
  }

  document.querySelectorAll('.profile-tabs .tab')
    .forEach(t=>t.addEventListener('click',handleTab));
}
