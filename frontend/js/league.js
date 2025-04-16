// league.js

// —————————————————————————————————————————————
// Секция обновления токена и UI для неавторизованных
// —————————————————————————————————————————————

if (localStorage.getItem('accToken') && localStorage.getItem('refToken')) {
  refreshToken();
}

let accToken = localStorage.getItem("accToken");
let refToken = localStorage.getItem("refToken");
if (!accToken || !refToken) {
  const notifBtn = document.getElementById("notification_button");
  const burgerAndUser = document.getElementById("header_right");
  while (burgerAndUser.firstChild) burgerAndUser.removeChild(burgerAndUser.firstChild);
  while (notifBtn.firstChild) notifBtn.removeChild(notifBtn.firstChild);
  burgerAndUser.innerHTML = `
    <a href="login.html">
      <div class="registerBtn">
        <button class="register">Zaloguj sie</button>
      </div>
    </a>`;
  burgerAndUser.style.backgroundColor = "white";
}

// —————————————————————————————————————————————
// Обработчики DOMContentLoaded
// —————————————————————————————————————————————

document.addEventListener("DOMContentLoaded", () => {
  // обновление метрик загрузки
  const pageLoadSpan = document.querySelector(".footer-content span:nth-child(3)");
  const htmlLoadSpan = document.querySelector(".footer-content span:nth-child(4)");
  if (pageLoadSpan && htmlLoadSpan) {
    window.addEventListener("load", () => {
      setTimeout(() => {
        const t = performance.timing;
        const p = Math.round((t.loadEventEnd - t.navigationStart) || performance.now());
        const h = Math.round((t.responseEnd - t.responseStart) || 0);
        pageLoadSpan.innerHTML = `Strona: <span class="blue">${p}ms</span>`;
        htmlLoadSpan.innerHTML = `Szablon: <span class="blue">${h}ms</span>`;
      }, 0);
    });
  }

  // один вызов всех загрузок
  loadLeagueBanner();
  loadLeagueDetails();
  loadLeagueTop();

  // logout-кнопка
  const lo = document.getElementById('log-out');
  if (lo) lo.addEventListener('click', logOut);
});

// —————————————————————————————————————————————
// Функции авторизации
// —————————————————————————————————————————————

async function refreshToken() {
  try {
    const res = await fetch("http://localhost:8765/auth/refresh-token", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("refToken")}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) throw new Error("Error Refresh Token");
    const tokens = await res.json();
    localStorage.setItem("accToken", tokens.accessToken);
    localStorage.setItem("refToken", tokens.refreshToken);
  } catch (err) {
    console.error(err);
  }
}

async function logOut() {
  try {
    const res = await fetch('http://localhost:8765/auth/logout', {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("accToken")}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    localStorage.clear();
    window.location.href = "main.html";
  } catch (err) {
    console.error(err);
  }
}

// —————————————————————————————————————————————
// Загрузка баннера лиги
// —————————————————————————————————————————————

async function loadLeagueBanner() {
  const leagueId = localStorage.getItem('searchedLeague');
  if (!leagueId) return;
  try {
    const res = await fetch(`http://localhost:8765/competition/get-image/${leagueId}`);
    if (!res.ok) return;
    const bannerUrl = await res.text();
    // баннер
    const bannerImg = document.querySelector('.banner img');
    if (bannerImg) bannerImg.src = bannerUrl;
    // аватар в Tournament Info
    const avatarImg = document.querySelector('.tournament-info .avatar img');
    if (avatarImg) avatarImg.src = bannerUrl;
  } catch (err) {
    console.error('Ошибка загрузки баннера:', err);
  }
}

// —————————————————————————————————————————————
// Загрузка деталей лиги
// —————————————————————————————————————————————

async function loadLeagueDetails() {
  const leagueId = localStorage.getItem('searchedLeague');
  if (!leagueId) return;

  try {
    // находим текущее соревнование в общем списке
    const all = await (await fetch('http://localhost:8765/competition/all')).json();
    const comp = all.find(c => c.id === leagueId);
    if (!comp) throw new Error('Competition not found');

    // статус + цвет точки
    const badge = document.querySelector('.active-badge');
    if (badge) {
      const dot = badge.querySelector('div');
      const txt = badge.querySelector('span');
      txt.textContent = comp.status;
      dot.style.backgroundColor = comp.status.toLowerCase() === 'active' ? 'green' : 'gray';
    }

    // название лиги
    const nm = document.querySelector('.tournament-name strong');
    if (nm) nm.textContent = comp.name;

    // вид спорта
    const sport = await (await fetch(`http://localhost:8765/sport/id/${comp.sportId}`)).json();
    const spSpan = document.querySelector('.tournament-name span');
    if (spSpan) spSpan.textContent = sport.name;

    // режим (из названия, например "1vs1" или "5v5")
    const mode = (comp.name.match(/(\d+v?s\d+)/i) || ['?'])[0].replace(/vs/i, ' v ');

    // макс. участников из game-system
    const sys = await (await fetch(
      `http://localhost:8765/game-system/${comp.gameSystemId}`,
      { headers: { "Authorization": `Bearer ${localStorage.getItem("accToken")}` } }
    )).json();
    const maxCount = sys.maxTeamSize ?? sys.playersPerTeam ?? '?';

    // текущий count
    const tbl = await (await fetch(`http://localhost:8765/competition/league-table/${leagueId}`)).json();
    const curCount = tbl.length;

    // дата старта
    const startDate = new Date(comp.startDate).toLocaleDateString('pl-PL');

    // заполняем группы .details
    const dets = document.querySelectorAll('.details div');
    if (dets.length >= 4) {
      dets[0].querySelector('strong').textContent = sport.name;
      dets[1].querySelector('strong').textContent = mode;
      dets[2].querySelector('strong').textContent = `${curCount} / ${maxCount}`;
      dets[3].querySelector('strong').textContent = startDate;
    }
  } catch (err) {
    console.error('Ошибка loadLeagueDetails:', err);
  }
}

// —————————————————————————————————————————————
// Загрузка топ‑списка лиги
// —————————————————————————————————————————————

async function loadLeagueTop() {
  const leagueId = localStorage.getItem('searchedLeague');
  if (!leagueId) {
    console.error('Не найден searchedLeague в localStorage');
    return;
  }

  try {
    // получаем таблицу и сортируем по победам
    const leagueTable = await (await fetch(`http://localhost:8765/competition/league-table/${leagueId}`)).json();
    leagueTable.sort((a, b) => b.wins - a.wins);

    const listEl = document.querySelector('.match-list');
    listEl.innerHTML = ''; // очистка перед вставкой

    for (const row of leagueTable) {
      let name = '';
      let imgUrl = '';

      if (row.playerId) {
        // — игрок —
        const user = await (await fetch(`http://localhost:8765/user/getUser/${row.playerId}`)).json();
        name = user.username;
        const avatarUrl = await (await fetch(`http://localhost:8765/user/avatar/${user.username}`)).text();
        imgUrl = avatarUrl || 'img/user.svg';

      } else if (row.teamId) {
        // — команда —
        const team = await (await fetch(`http://localhost:8765/team/current/${row.teamId}`)).json();
        name = team.teamName;
        const logoUrl = await (await fetch(`http://localhost:8765/team/team-logo/${row.teamId}`)).text();
        imgUrl = logoUrl || 'img/default-team-avatar.png';
      }

      // рендер одной карточки
      listEl.insertAdjacentHTML('beforeend', `
        <div class="match">
          <div class="team-details">
            <img src="${imgUrl}" alt="" class="player-avatar">
            <strong>${name}</strong>
          </div>
          <div class="team-place">
            <span>Place:</span>
            <div class="badge">
              <strong>${row.wins}</strong>
              <div></div>
            </div>
          </div>
          <div class="team-victories">
            <span>Victories:</span>
            <strong>${row.wins}</strong>
          </div>
          <div>
            <strong><img src="img/chevron-right.svg" alt=""></strong>
          </div>
        </div>
      `);
    }
  } catch (err) {
    console.error('Ошибка loadLeagueTop:', err);
  }
}

// —————————————————————————————————————————————
// Переключение на список участников (“Teams”)
// —————————————————————————————————————————————

document.addEventListener('DOMContentLoaded', () => {
  const teamsBtn = document.querySelector('.sidebar button:nth-child(1)');
  const topBtn = document.querySelector('.sidebar button:nth-child(3)');
  const contentList = document.querySelector('.match-list');
  const headerH3 = document.querySelector('.match-header h3');

  function activate(button) {
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
  }

  if (teamsBtn) teamsBtn.addEventListener('click', async () => {
    activate(teamsBtn);
    if (headerH3) headerH3.textContent = 'Zespole:';
    await loadLeagueTeams();
  });

  if (topBtn) topBtn.addEventListener('click', async () => {
    activate(topBtn);
    if (headerH3) headerH3.textContent = 'Top:';
    await loadLeagueTop();
  });
});

// —————————————————————————————————————————————
// Загрузка списка участников лиги (игроки + команды) алфавитом
// —————————————————————————————————————————————

async function loadLeagueTeams() {
  const leagueId = localStorage.getItem('searchedLeague');
  if (!leagueId) return;

  try {
    const tbl = await (await fetch(`http://localhost:8765/competition/league-table/${leagueId}`)).json();
    const participants = await Promise.all(tbl.map(async row => {
      if (row.playerId) {
        const u = await (await fetch(`http://localhost:8765/user/getUser/${row.playerId}`)).json();
        const avatar = await fetch(`http://localhost:8765/user/avatar/${u.username}`)
          .then(r => r.ok ? r.text() : 'img/profile.svg')
          .catch(() => 'img/profile.svg');
        return { name: u.username, img: avatar };
      } else {
        const t = await (await fetch(`http://localhost:8765/team/current/${row.teamId}`)).json();
        const logo = await fetch(`http://localhost:8765/team/team-logo/${row.teamId}`)
          .then(r => r.ok ? r.text() : 'img/default-team-avatar.png')
          .catch(() => 'img/default-team-avatar.png');
        return { name: t.teamName, img: logo };
      }
    }));

    participants.sort((a, b) => a.name.localeCompare(b.name, 'pl-PL'));

    const listEl = document.querySelector('.match-list');
    listEl.innerHTML = '';

    participants.forEach(p => {
      listEl.insertAdjacentHTML('beforeend', `
        <div class="match">
          <div class="team-details">
            <img src="${p.img}" alt="" class="player-avatar">
            <strong>${p.name}</strong>
          </div>
          <div>
            <strong><img src="img/chevron-right.svg" alt=""></strong>
          </div>
        </div>
      `);
    });
  } catch (err) {
    console.error('Ошибка loadLeagueTeams:', err);
  }
}
