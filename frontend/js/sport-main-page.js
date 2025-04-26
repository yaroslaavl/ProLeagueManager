/* sport-main-page.js – версия с учётом правок */

document.addEventListener('DOMContentLoaded', loadMainPageCompetitions);
document.addEventListener('DOMContentLoaded', () => {
  const pageLoadSpan = document.querySelector('.footer-content span:nth-child(3)');
  const htmlLoadSpan = document.querySelector('.footer-content span:nth-child(4)');

  if (pageLoadSpan && htmlLoadSpan) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const performanceTiming = performance.timing;
        const pageLoadTime = performanceTiming.loadEventEnd - performanceTiming.navigationStart;
        const htmlLoadTime = performanceTiming.responseEnd - performanceTiming.responseStart;
        const validPageLoadTime = pageLoadTime > 0 ? pageLoadTime : performance.now();
        const validHtmlLoadTime = htmlLoadTime > 0 ? htmlLoadTime : 0;
        pageLoadSpan.innerHTML = `Strona: <span class="blue">${Math.round(validPageLoadTime)}ms</span>`;
        htmlLoadSpan.innerHTML = `Szablon: <span class="blue">${Math.round(validHtmlLoadTime)}ms</span>`;
        console.log('Page Load Time (ms):', validPageLoadTime);
        console.log('HTML Load Time (ms):', validHtmlLoadTime);
      }, 0);
    });
  }
});

async function loadMainPageCompetitions() {
  try {
    const accToken = localStorage.getItem('accToken');

    // 1) Получаем все соревнования
    const competitionsResponse = await fetch('http://localhost:8765/competition/all', {
      headers: { Authorization: `Bearer ${accToken}` },
    });
    if (!competitionsResponse.ok) {
      throw new Error(`Ошибка при получении соревнований: ${competitionsResponse.status}`);
    }
    let competitions = await competitionsResponse.json();

    // 🔥 Сразу считаем и выводим количество активных матчей (спорт / e‑спорт)
    await updateActiveCompetitionsCount(competitions);

    // 2) Для каждого соревнования получаем данные о спорте и баннере
    for (const competition of competitions) {
      try {
        // Получаем данные о спорте
        const sportResponse = await fetch(`http://localhost:8765/sport/id/${competition.sportId}`);
        if (sportResponse.ok) {
          const sportData = await sportResponse.json();
          competition.sportName = sportData.name;
          competition.isEsport = sportData.isEsport;
        } else {
          competition.sportName = 'Nieznany sport';
          competition.isEsport = false;
        }

        // Получаем URL баннера
        const bannerResponse = await fetch(`http://localhost:8765/competition/get-image/${competition.id}`, {
          headers: { Authorization: `Bearer ${accToken}` },
        });
        if (bannerResponse.ok) {
          const bannerUrl = await bannerResponse.text();
          competition.bannerUrl = bannerUrl && !bannerUrl.includes('minio:9000') ? bannerUrl : 'img/blogo%202.png';
        } else {
          competition.bannerUrl = 'img/blogo%202.png';
        }
      } catch {
        competition.sportName = 'Nieznany sport';
        competition.isEsport = false;
        competition.bannerUrl = 'img/blogo%202.png';
      }
    }

    // 3) Определяем тип (спорт / е‑спорт) согласно кнопке меню
    const sportyText = document.getElementById('sportyButton')?.textContent.trim();
    const isEsportRequired = sportyText && sportyText.toLowerCase() !== 'sporty';
    competitions = competitions.filter((c) => c.isEsport === isEsportRequired);

    // 4) Сортируем
    competitions.sort((a, b) => {
      if (a.sportName < b.sportName) return -1;
      if (a.sportName > b.sportName) return 1;
      return new Date(a.startDate) - new Date(b.startDate);
    });

    // 5) Разделяем
    let tournaments = competitions.filter((c) => c.competitionType === 'TOURNAMENT');
    let leagues = competitions.filter((c) => c.competitionType === 'LEAGUE');

    // 6) Ограничиваем вывод
    tournaments = tournaments.slice(0, 3);
    leagues = leagues.slice(0, 2);

    // 7) Рендер турниров
    const tournamentsContainer = document.querySelector('.tournaments');
    tournamentsContainer.innerHTML = '';
    for (const tournament of tournaments) {
      const startDateStr = formatDateTime(tournament.startDate);
      const endDateStr = formatDateTime(tournament.endDate);
      const tournamentEl = document.createElement('div');
      tournamentEl.classList.add('tournament');
      tournamentEl.innerHTML = `
        <img src="${tournament.bannerUrl}" alt="Tournament Logo" style="border-radius: 8px;" onerror="this.src='img/blogo%202.png'">
        <div class="tournament-name">
          <p class="tournament-tittle" style="font-weight: bold;color: #000">${tournament.name}</p>
          <p class="status">${tournament.status}</p>
        </div>
        <div class="start-date"><p class="tournament-tittle">Start:</p><p>${startDateStr}</p></div>
        <div class="end-date"><p class="tournament-tittle">Koniec:</p><p>${endDateStr}</p></div>
        <div class="game-system"><p class="tournament-tittle">Sport:</p><p class="system">${tournament.sportName ?? '?'}</p></div>
        <div class="teams"><p class="tournament-tittle">Zespoly:</p><p class="count">?</p></div>
        <a href="tournaments.html" onclick="localStorage.setItem('searchedTournament', '${tournament.id}');">
          <img src="img/style=linear.svg" alt="" style="height: 20px;margin-top: 40px">
        </a>`;
      tournamentsContainer.appendChild(tournamentEl);

      // Подсчёт участников
      try {
        const countResp = await fetch(
          `http://localhost:8765/competition/count-of-signed-in?competitionId=${tournament.id}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('accToken')}` } },
        );
        if (countResp.ok) {
          const cnt = await countResp.json();
          const span = tournamentEl.querySelector('.teams .count');
          if (span) span.textContent = cnt;
        }
      } catch {
        /* noop */
      }
    }

    // 8) Рендер лиг
    const leaguesContainer = document.querySelector('.league-content');
    leaguesContainer.innerHTML = '';
    for (const league of leagues) {
      const startDateStr = formatDateTime(league.startDate);
      const endDateStr = formatDateTime(league.endDate);
      const leagueEl = document.createElement('div');
      leagueEl.classList.add('league');
      leagueEl.innerHTML = `
        <div class="league-tittle">
          <img src="${league.bannerUrl}" alt="League Logo" style="border-radius: 8px;" onerror="this.src='img/blogo%202.png'">
          <div class="league-tittle-text">
            <div>
              <p style="font-weight: bold;margin-bottom:-5px">${league.name}</p>
              <p style="color:#808A9D;font-size:12px">${league.sportName ?? '?'}</p>
            </div>
            <a href="leagues.html" onclick="localStorage.setItem('searchedLeague', '${league.id}');">
              <img src="img/style=linear.svg" alt="" style="height:20px">
            </a>
          </div>
        </div>
        <div class="options">
          <div class="start-date"><p class="tournament-tittle">Start:</p><p>${startDateStr}</p></div>
          <div class="end-date"><p class="tournament-tittle">Koniec:</p><p>${endDateStr}</p></div>
          <div class="game-system"><p class="tournament-tittle">Sport:</p><p class="system">${league.sportName ?? '?'}</p></div>
          <div class="teams"><p class="tournament-tittle">Zespoly:</p><p class="count">?</p></div>
        </div>
        <div class="top"></div>`;
      leaguesContainer.appendChild(leagueEl);

      // Таблица лиги + top‑3
      try {
        const resp = await fetch(`http://localhost:8765/competition/league-table/${league.id}`);
        if (resp.ok) {
          const table = await resp.json();
          table.sort((a, b) => b.wins - a.wins);
          const top3 = table.slice(0, 3);
          let count = table.length;
          if (count && table[0].playerId != null) count = table.filter((r) => r.playerId != null).length;
          if (count && table[0].teamId != null) count = table.filter((r) => r.teamId != null).length;
          const countSpan = leagueEl.querySelector('.teams .count');
          if (countSpan) countSpan.textContent = count;

          let html = '';
          for (const row of top3) {
            if (row.playerId) {
              let userData;
              let avatarUrl = 'http://localhost:9000/user-image-bucket/avatars/default-user.png';
              try {
                const userResponse = await fetch(`http://localhost:8765/user/getUser/${row.playerId}`);
                if (userResponse.ok) {
                  userData = await userResponse.json();
                  const potentialAvatar = `http://localhost:8765/user/avatar/${userData.username}`;
                  avatarUrl = potentialAvatar && !potentialAvatar.includes('minio:9000') ? potentialAvatar : avatarUrl;
                } else {
                  userData = { username: 'Nieznany' };
                }
              } catch {
                userData = { username: 'Nieznany' };
              }

              html += `
                <div class='player'>
                  <div class='player-info'>
                    <img src='${avatarUrl}' alt='Player' onerror="this.src='http://localhost:9000/user-image-bucket/avatars/default-user.png'">
                    <p class='player-name'>${userData.username}</p>
                  </div>
                  <div class='win-count'>
                    <p>Ilosc zwycienstw:</p>
                    <p class='count'>${row.wins ?? '?'}</p>
                  </div>
                </div>`;
            }
          }
          leagueEl.querySelector('.top').innerHTML = html;
        }
      } catch {
        /* noop */
      }
    }
  } catch (err) {
    console.error('Ошибка при загрузке данных соревнований:', err);
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// -----------------
// Подсчёт активных соревнований (спорт / e‑спорт)
// -----------------
async function updateActiveCompetitionsCount(allCompetitions) {
  try {
    const sportyText = document.getElementById('sportyButton')?.textContent.trim();
    const isEsportRequired = sportyText && sportyText.toLowerCase() !== 'sporty';

    const isEsportMap = new Map();
    let totalActive = 0;

    for (const competition of allCompetitions) {
      if (isEsportMap.has(competition.sportId)) {
        if (isEsportMap.get(competition.sportId) === isEsportRequired) totalActive++;
        continue;
      }

      try {
        const resp = await fetch(`http://localhost:8765/sport/id/${competition.sportId}`);
        if (resp.ok) {
          const sportData = await resp.json();
          isEsportMap.set(competition.sportId, sportData.isEsport);
          if (sportData.isEsport === isEsportRequired) totalActive++;
        }
      } catch {
        /* noop */
      }
    }

    const tittleDown = document.querySelector('.tittle-down p');
    if (tittleDown) {
      tittleDown.innerHTML = `Aktywnych zawodow: <strong>${totalActive}</strong>`;
    }
  } catch (err) {
    console.error('Ошибка при подсчёте активных матчей:', err);
  }
}
async function logOut(){
  try {
    let accToken = localStorage.getItem("accToken");
    let refToken = localStorage.getItem("refToken");
    const response = await fetch('http://localhost:8765/auth/logout',{
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${accToken}`, // Добавляем заголовок Authorization
        "Content-Type": "application/json" // Указываем формат данных
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    localStorage.clear();
    window.location.href = "main.html";
  }catch (err){
    console.error(`${err}`);
  }
}
//------------------------------------------------------------------
//  sport-main-page.js  (добавьте после updateActiveCompetitionsCount)
//------------------------------------------------------------------
async function loadNews () {
  const wrapper = document.querySelector('.news-track');
  if (!wrapper) return;

  try {
    const acc = localStorage.getItem('accToken');
    const resp = await fetch('http://localhost:8765/event/pinned',
      { headers:{ Authorization:`Bearer ${acc}` }});
    if (!resp.ok) throw new Error(resp.status);
    let events = await resp.json();                // pinned & published

    /* ---- фильтр: GLOBAL + SPORT (только спорт, не e-sport) ---------- */
    events = events.filter(e => e.category === 'GLOBAL' || e.category === 'SPORT');

    /* ---- самые свежие сверху --------------------------------------- */
    events.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

    /* ---- строим слайды -------------------------------------------- */
    wrapper.innerHTML = '';
    for (const ev of events) {
      let imgUrl = 'img/default-event.png';
      try {
        const r = await fetch(`http://localhost:8765/event/image/${ev.id}`,
          { headers:{ Authorization:`Bearer ${acc}` }});
        if (r.ok) {
          const u = await r.text();
          imgUrl = u && !u.includes('minio:9000') ? u : imgUrl;
        }
      } catch {/* ignore */}

      // вместо old wrapper.insertAdjacentHTML(...)
      wrapper.insertAdjacentHTML('beforeend', `
        <div class="news-slide" data-id="${ev.id}" data-type="${ev.eventType}" data-type="${ev.eventType}" data-comp ="${ev.competitionId ?? ''}"
            style="background-image:url('${imgUrl}');">
            <p>${ev.title}</p>
            <time>${new Date(ev.createdAt)
        .toLocaleDateString('pl-PL',{year:'numeric',
          month:'2-digit',
          day:'2-digit'})}</time>
        </div>`);

    }

    initNewsSlider();            // стрелочки
  } catch (err) { console.error('News error', err); }
}

/* ---------- лёгкий slider ----------------------------------------- */
function initNewsSlider(){
  const track = document.querySelector('.news-track');
  const prev  = document.querySelector('.news-prev');
  const next  = document.querySelector('.news-next');
  if (!track || !prev || !next) return;

  let index = 0;
  const slideWidth = 900 + 30; // ширина карточки + gap (20px)
  // ширина слайда + gap
  const maxIndex = Math.max(0, track.children.length - 1);

  function update(){
    track.style.transform = `translateX(${-index*slideWidth}px)`;
    prev.disabled = index === 0;
    next.disabled = index === maxIndex;
  }
  prev.onclick = ()=>{ if(index>0){ index--; update(); }};
  next.onclick = ()=>{ if(index<maxIndex){ index++; update(); }};
  update();
}

/* ------------------------------------------------------------------ */
/*  ВКЛЮЧАЕМ загрузку новостей вместе с остальной инициализацией      */
document.addEventListener('DOMContentLoaded', loadNews);
/* -------- переход по клику на карточку ------------------------- */
const track = document.querySelector('.news-track');
track.addEventListener('click', e=>{
  const slide = e.target.closest('.news-slide');
  if (!slide) return;

  const type  = slide.dataset.type;          // GLOBAL | LEAGUE | TOURNAMENT …
  const match = slide.dataset.match;
  const comp  = slide.dataset.comp;

  if (match) {                               // матч
    localStorage.setItem('searchedMatch', match);
    location.href = 'match-page.html';
    return;
  }

  if (comp) {                                // лига или турнир
    if (type === 'LEAGUE') {
      localStorage.setItem('searchedLeague', comp);
      location.href = 'leagues.html';
    } else {                                // считаем всё остальное турниром
      localStorage.setItem('searchedTournament', comp);
      location.href = 'tournaments.html';
    }
  }
  /* если GLOBAL — ничего не делаем */
});
