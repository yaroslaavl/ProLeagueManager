const API = 'http://localhost:8765';
let currentUserId = null;

function authHeaders () {
  return {
    'Authorization': `Bearer ${localStorage.getItem('accToken')}`,
    'Content-Type' : 'application/json'
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  try {

    const accToken = localStorage.getItem("accToken");
    const refToken = localStorage.getItem("refToken");

    if (!accToken || !refToken) {
      window.location.href = "main.html";
      return;
    }


    await refreshToken();


    await getUserData();



  } catch (err) {
    console.error("Ошибка при загрузке страницы:", err);
  }
});


async function refreshToken() {
  try {
    const url = "http://localhost:8765/auth/refresh-token";
    const refToken = localStorage.getItem("refToken");

    if (!refToken) throw new Error("Отсутствует refreshToken");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${refToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error("Ошибка при обновлении токена");

    const Tokens = await response.json();
    localStorage.setItem("accToken", Tokens.accessToken);
    localStorage.setItem("refToken", Tokens.refreshToken);
  } catch (err) {
    console.error("Ошибка обновления токена:", err);
    logOut();
  }
}


async function getUserData() {
  try {
    const url = `http://localhost:8765/user/profile`;
    const accToken = localStorage.getItem("accToken");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error(`Ошибка загрузки данных пользователя: ${response.status}`);

    const data = await response.json();
    currentUserId = data.id;


    document.getElementById('first_last_name').innerHTML = `${data.firstName} ${data.lastName}`;
    document.getElementById("nickname").innerHTML = data.username;
    document.getElementById("date_of_birth").innerHTML = data.birthDate.split('-').reverse().join('.');
    document.getElementById("creation-date").innerHTML = new Date(data.createdAt).toLocaleDateString();


    await getTeam(data.id);


    try {
      const res = await fetch(`http://localhost:8765/user/avatar/${data.username}`);
      const urlImg = await res.text();
      document.getElementById('profile_img').src = urlImg;
    } catch (err) {
      console.error('Ошибка при загрузке аватара пользователя!');
    }

  } catch (err) {
    console.error(`Ошибка загрузки данных пользователя: ${err}`);
  }
}


async function logOut() {
  try {
    const accToken = localStorage.getItem("accToken");

    const response = await fetch('http://localhost:8765/auth/logout', {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error(`Ошибка выхода: ${response.status}`);

  } catch (err) {
    console.error("Ошибка при выходе:", err);
  } finally {
    localStorage.clear();
    window.location.href = "main.html";
  }
}


async function getTeam(userId) {
  try {
    const url = `http://localhost:8765/team/get-teams-by-userId?userId=${userId}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Ошибка загрузки команд");
      return;
    }

    const data = await response.json();
    const teamsContainer = document.getElementById('teams-container');
    teamsContainer.innerHTML = '';

    if (!data || data.length === 0) {
      console.warn("Нет команд для данного пользователя.");
      return;
    }

    for (let team of data) {
      const teamElement = document.createElement("div");
      teamElement.classList.add("teams");

      const teamImage = document.createElement("img");
      teamImage.alt = "Team_avatar";

      try {
        const logoResponse = await fetch(`http://localhost:8765/team/team-logo/${team.id}`);
        if (logoResponse.ok) {
          teamImage.src = await logoResponse.text();
        } else {
          teamImage.src = "img/default-team-avatar.png";
        }
      } catch (err) {
        console.error("Ошибка при загрузке логотипа команды", err);
        teamImage.src = "img/default-team-avatar.png";
      }
      const roleElement = document.createElement("p");
      roleElement.innerText = "Ładowanie ról...";

      try {
        const roleResponse = await fetch(`http://localhost:8765/team/get-team-member-by-team-and-userId?teamId=${team.id}&userId=${userId}`);
        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          if (roleData.roles && roleData.roles.length > 0) {
            roleElement.innerText = roleData.roles.map(role => role.name).join(", ");
          } else {
            roleElement.innerText = "Brak ról";
          }
        } else {
          roleElement.innerText = "Błąd wczytywania ról";
        }
      } catch (err) {
        console.error("Error while fetching team role:", err);
        roleElement.innerText = "Błąd wczytywania ról";
      }



      const teamNameLink = document.createElement("a");
      teamNameLink.href = "teamPage.html";
      teamNameLink.style.color = "#000000";
      teamNameLink.style.fontWeight = "bold";
      teamNameLink.innerText = team.teamName;
      teamNameLink.addEventListener("click", () => localStorage.setItem("MyTeam", team.teamName));

      teamElement.appendChild(teamImage);
      teamElement.appendChild(teamNameLink);
      teamsContainer.appendChild(teamElement);
      teamElement.appendChild(roleElement);
    }
  } catch (err) {
    console.error("Ошибка при получении списка команд:", err);
  }
}

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


document.addEventListener("DOMContentLoaded", function () {
  const createTeamBtn = document.getElementById("create_team_btn");
  if (createTeamBtn) {
    createTeamBtn.addEventListener("click", openCreateTeamDialog);
  } else {
    console.error("Кнопка создания команды не найдена в DOM");
  }
});

function openCreateTeamDialog() {

  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "1000";


  const dialog = document.createElement("div");
  dialog.style.background = "#fff";
  dialog.style.padding = "20px 20px";
  dialog.style.borderRadius = "8px";
  dialog.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  dialog.style.minWidth = "400px";
  dialog.style.textAlign = "center";


  const title = document.createElement("h2");
  title.textContent = "Stworzenie zespolu";
  const paragraph = document.createElement("p");
  paragraph.innerHTML = "Wpisz nazwę swojego zespołu.<br>Pamiętaj, że wulgarna nazwa zespołu spowoduje:<br> - zablokowanie<br> - usunięcie zespołu<br> - zablokowanie twórcy zespołu!";
  paragraph.style.color = "#808A9D";
  paragraph.style.textIndent = "20px";


  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Nazwa zespołu";
  input.style.width = "80%";
  input.style.padding = "8px";
  input.style.margin = "10px 0";
  input.style.border = "1px solid #ccc";
  input.style.borderRadius = "4px";


  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "Potwierdzić";
  confirmBtn.style.padding = "8px 16px";
  confirmBtn.style.border = "none";
  confirmBtn.style.backgroundColor = "#007bff";
  confirmBtn.style.color = "white";
  confirmBtn.style.borderRadius = "4px";
  confirmBtn.style.cursor = "pointer";

  confirmBtn.addEventListener("click", async function () {
    const teamName = input.value.trim();
    const teamNameUpload = {
      teamName: teamName,
    }
    if (teamName) {
      try {

        const response = await fetch(`http://localhost:8765/team/create-team`,{
          method: "POST",
          body: JSON.stringify(teamNameUpload),
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('accToken')}`,
            "Content-type": "application/json"
          }
        });
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        };
        const data = await response.json();
        console.log("Server response:", data);
        location.reload();
      } catch (err) {
        console.error("Problem with creating team!", err);
      }
      document.body.removeChild(overlay);
    } else {
      alert("Proszę wprowadzić nazwę zespołu.");
    }
  });


  const closeButton = document.createElement("button");
  closeButton.textContent = "X";
  closeButton.style.position = "absolute";
  closeButton.style.top = "10px";
  closeButton.style.right = "10px";
  closeButton.style.background = "none";
  closeButton.style.border = "none";
  closeButton.style.fontSize = "16px";
  closeButton.style.cursor = "pointer";

  closeButton.addEventListener("click", function () {
    document.body.removeChild(overlay);
  });

  dialog.style.position = "relative";

  dialog.appendChild(closeButton);
  dialog.appendChild(title);
  dialog.appendChild(paragraph);
  dialog.appendChild(input);
  dialog.appendChild(confirmBtn);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

async function safeJson (res) {
  if (res.status === 204 || res.status === 205) return [];
  const text = await res.text();
  if (!text.trim()) return [];
  return JSON.parse(text);
}

async function fetchMatches () {
  const url = `${API}/match/user?userId=${currentUserId}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(res.status);
  return safeJson(res);
}

async function fetchCompetitions (type) {
  const url = `${API}/competition/user?userId=${currentUserId}` +
    `&competitionType=${type}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(res.status);
  return safeJson(res);
}

function renderMatches(list) {
  const title = document.querySelector('.content-placeholder .title');
  const cols  = document.querySelector('.content-placeholder .columns');
  const body  = document.getElementById('teams-container');
  const createBtn = document.getElementById('create_team_btn');

  title.textContent = 'Mecze';
  createBtn.style.display = 'none';


  const gridDef = '120px 1fr 70px';
  cols.innerHTML = `
      <span>Data:</span>
      <span>Status:</span>
      <span>Wynik:</span>`;
  Object.assign(cols.style, {
    marginTop           : '10px',
    display             : 'grid',
    gridTemplateColumns : gridDef,
    alignItems          : 'center',
    gap                 : '20px',
    width               : '100%'
  });


  if (!list.length) {
    body.innerHTML = '<p style="padding:20px 0;">Brak danych</p>';
    return;
  }


  body.innerHTML = list.map(m => {
    const score = `${m.scoreA ?? 0}:${m.scoreB ?? 0}`;
    return `
      <div class="match-row" data-id="${m.id ?? m.matchId ?? m.stageId}"
           style="
             display:grid;
             grid-template-columns:${gridDef};
             align-items:center;
             gap:20px;
             padding:10px;
             margin:10px 0;
             background:#fff;
             border-radius:12px;
             cursor:pointer;">
        <span style="font-weight:bold;color: #000000;">${m.matchDate?.slice(0,10) || '-'}</span>
        <span style="font-weight: bold">${m.matchStatus}</span>
        <span style="font-weight:bold;color: #000000;">${score}</span>
      </div>`;}).join('');


  body.querySelectorAll('.match-row').forEach(row => {
    const id = row.dataset.id;
    row.addEventListener('click', () => {
      localStorage.setItem('searchedMatch', id);
      location.href = 'match-page.html';
    });
  });
}






async function renderCompetitions(list, type) {
  const title  = document.querySelector('.content-placeholder .title');
  const cols   = document.querySelector('.content-placeholder .columns');
  const body   = document.getElementById('teams-container');
  const create = document.getElementById('create_team_btn');


  const gridDef = '45px 1fr 80px 130px';


  title.textContent = type === 'LEAGUE' ? 'Ligi' : 'Turnieje';
  cols.innerHTML = `
      <span>Baner</span>
      <span>Nazwa</span>
      <span>Status</span>
      <span>Od&nbsp;/&nbsp;Do</span>`;
  Object.assign(cols.style, {
    marginTop            : '10px',
    display              : 'grid',
    gridTemplateColumns  : gridDef,
    alignItems           : 'center',
    gap                  : '20px',
    width                : '100%'
  });

  create.style.display = 'none';

  if (!list.length) {
    body.innerHTML = '<p style="padding:20px 0;">Brak danych</p>';
    return;
  }


  body.innerHTML = list.map(c => `
    <div class="competition-row" data-id="${c.id}"
         style="
           display:grid;
           grid-template-columns:${gridDef};
           align-items:center;
           gap:20px;
           padding:10px;
           margin:10px 0;
           background:#fff;
           border-radius:12px;
           cursor:pointer;">
      <img class="comp-banner"
           style="width:45px;height:45px;object-fit:cover;border-radius:12px"
           src="" alt="banner">

      <span style="font-weight:bold;color: #000000">${c.name}</span>
      <span style="font-weight:bold;">${c.status}</span>
      <span style="color: #000000;font-weight: bold">${c.startDate.slice(0,10)} ➜ ${c.endDate.slice(0,10)}</span>
    </div>`).join('');


  await Promise.all(list.map(async c => {
    try {
      const res = await fetch(`${API}/competition/get-image/${c.id}`);
      if (!res.ok) throw new Error(res.status);
      const url = await res.text();

      const img = body.querySelector(
        `.competition-row[data-id="${c.id}"] .comp-banner`);
      if (img) img.src = url;
    } catch (e) {
      console.warn('banner load fail', c.id, e);
    }
  }));


  body.querySelectorAll('.competition-row').forEach(row => {
    const id = row.dataset.id;
    row.addEventListener('click', () => {
      if (type === 'LEAGUE') {
        localStorage.setItem('searchedLeague', id);
        location.href = 'leagues.html';
      } else {
        localStorage.setItem('searchedTournament', id);
        location.href = 'tournaments.html';
      }
    });
  });
}




async function handleTabClick (e) {
  const tabText = e.target.textContent.trim();


  document.querySelectorAll('.profile-tabs .tab')
    .forEach(t => t.classList.toggle('active', t === e.target));

  try {
    switch (tabText) {
      case 'Ligi': {
        const data = await fetchCompetitions('LEAGUE');
        renderCompetitions(data, 'LEAGUE');
        break;
      }
      case 'Turnieje': {
        const data = await fetchCompetitions('TOURNAMENT');
        renderCompetitions(data, 'TOURNAMENT');
        break;
      }
      case 'Drużyny': {

        document.querySelector('.content-placeholder .title').textContent = 'Drużyny';
        document.querySelector('.content-placeholder .columns').innerHTML = `
             <p>Zdjęcie:</p><p>Nazwa:</p><p>Role:</p>`;
        document.getElementById('teams-container').innerHTML = '';
        document.getElementById('create_team_btn').style.display = 'block';
        await getTeam(currentUserId);
        break;
      }
      case 'Mecze': {
        const data = await fetchMatches();
        renderMatches(data);
        break;
      }

      default:
        toast('Wkrótce ⚙️');
    }
  } catch (err) {
    console.error(err);
    toast('Błąd pobierania danych', true);
  }
}
document.querySelectorAll('.profile-tabs .tab')
  .forEach(t => t.addEventListener('click', handleTabClick));



if (typeof toast !== 'function') {

  function toast (txt, err = false, ms = 3000) {


    let box = document.getElementById('toastContainer');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toastContainer';
      Object.assign(box.style, {
        position : 'fixed',
        bottom   : '20px',
        right    : '20px',
        zIndex   : 9999,
        display  : 'flex',
        flexDirection : 'column',
        alignItems    : 'flex-end',
        gap      : '8px',
      });
      document.body.appendChild(box);
    }


    const item = document.createElement('div');
    item.textContent = txt;
    Object.assign(item.style, {
      maxWidth     : '260px',
      padding      : '10px 14px',
      borderRadius : '6px',
      background   : err ? '#e84118' : '#2ecc71',
      color        : '#fff',
      fontSize     : '14px',
      boxShadow    : '0 2px 6px rgba(0,0,0,.25)',
      wordBreak    : 'break-word',
      opacity      : '0',
      transition   : 'opacity .2s ease',
    });

    box.appendChild(item);


    requestAnimationFrame(() => { item.style.opacity = '1'; });


    setTimeout(() => {
      item.style.opacity = '0';
      item.addEventListener('transitionend', () => item.remove());
    }, ms);
  }
}
