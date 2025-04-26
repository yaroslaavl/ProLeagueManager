/* esport-main-page.js – версия с подсчётом количества активных матчей */

document.addEventListener('DOMContentLoaded', loadMainPageCompetitions);
document.addEventListener('DOMContentLoaded', () => {
  const pageLoadSpan = document.querySelector('.footer-content span:nth-child(3)');
  const htmlLoadSpan = document.querySelector('.footer-content span:nth-child(4)');

  if (pageLoadSpan && htmlLoadSpan) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const pt = performance.timing;
        const pageLoadTime = pt.loadEventEnd - pt.navigationStart;
        const htmlLoadTime = pt.responseEnd - pt.responseStart;
        const validPage = pageLoadTime > 0 ? pageLoadTime : performance.now();
        const validHtml = htmlLoadTime > 0 ? htmlLoadTime : 0;
        pageLoadSpan.innerHTML = `Strona: <span class='blue'>${Math.round(validPage)}ms</span>`;
        htmlLoadSpan.innerHTML = `Szablon: <span class='blue'>${Math.round(validHtml)}ms</span>`;
      }, 0);
    });
  }
});

async function loadMainPageCompetitions() {
  try {
    const accToken = localStorage.getItem('accToken');

    // 1) Получаем все соревнования
    const resp = await fetch('http://localhost:8765/competition/all', {
      headers: { Authorization: `Bearer ${accToken}` },
    });
    if (!resp.ok) throw new Error(`Ошибка: ${resp.status}`);
    let comps = await resp.json();

    // 🔥 Выводим количество активных е‑спортивных соревнований
    await updateActiveEsportCount(comps);

    // 2) Для каждого соревнования подтягиваем спорт + баннер
    await Promise.all(
      comps.map(async (c) => {
        try {
          const s = await fetch(`http://localhost:8765/sport/id/${c.sportId}`);
          if (s.ok) {
            const sd = await s.json();
            c.sportName = sd.name;
            c.isEsport = sd.isEsport;
          } else {
            c.sportName = 'Nieznany sport';
            c.isEsport = false;
          }

          const bannerResp = await fetch(`http://localhost:8765/competition/get-image/${c.id}`, {
            headers: { Authorization: `Bearer ${accToken}` },
          });
          if (bannerResp.ok) {
            const url = await bannerResp.text();
            c.bannerUrl = url && !url.includes('minio:9000') ? url : 'img/blogo%202.png';
          } else {
            c.bannerUrl = 'img/blogo%202.png';
          }
        } catch {
          c.sportName = 'Nieznany sport';
          c.isEsport = false;
          c.bannerUrl = 'img/blogo%202.png';
        }
      })
    );

    // 3) Оставляем только е‑спорт
    comps = comps.filter((c) => c.isEsport === true);

    // 4) Сортировка
    comps.sort((a, b) => {
      if (a.sportName < b.sportName) return -1;
      if (a.sportName > b.sportName) return 1;
      return new Date(a.startDate) - new Date(b.startDate);
    });

    // 5) Разделяем
    const tours = comps.filter((c) => c.competitionType === 'TOURNAMENT').slice(0, 3);
    const leagues = comps.filter((c) => c.competitionType === 'LEAGUE').slice(0, 2);

    renderTournaments(tours);
    renderLeagues(leagues);
  } catch (err) {
    console.error(err);
  }
}

function formatDateTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------
// Подсчёт активных е‑спорт соревнований
// ---------------------------
async function updateActiveEsportCount(allCompetitions) {
  try {
    const isEsportRequired = true; // Страница e‑sport всегда ищет только e‑sport
    const cache = new Map();
    let total = 0;

    for (const c of allCompetitions) {
      if (cache.has(c.sportId)) {
        if (cache.get(c.sportId) === isEsportRequired) total++;
        continue;
      }
      try {
        const r = await fetch(`http://localhost:8765/sport/id/${c.sportId}`);
        if (r.ok) {
          const sd = await r.json();
          cache.set(c.sportId, sd.isEsport);
          if (sd.isEsport === isEsportRequired) total++;
        }
      } catch {
        /* пропускаем при ошибке */
      }
    }

    const tittleDown = document.querySelector('.tittle-down p');
    if (tittleDown) {
      tittleDown.innerHTML = `Aktywnych zawodow: <strong>${total}</strong>`;
    }
  } catch (err) {
    console.error('Ошибка при подсчёте активных матчей (e‑sport):', err);
  }
}

/* ---------- renderTournaments / renderLeagues остаются без изменений ниже ---------- */

async function renderTournaments(tours) {
  const cont = document.querySelector('.tournaments');
  cont.innerHTML = '';
  for (const t of tours) {
    const start = formatDateTime(t.startDate);
    const end = formatDateTime(t.endDate);
    const el = document.createElement('div');
    el.classList.add('tournament');
    el.innerHTML = `
      <img src="${t.bannerUrl}" alt="Tournament Logo" style="border-radius: 8px;" onerror="this.src='img/blogo%202.png'">
      <div class="tournament-name">
        <p class="tournament-tittle" style="font-weight:bold;color:#000">${t.name}</p>
        <p class="status">${t.status}</p>
      </div>
      <div class="start-date"><p class="tournament-tittle">Start:</p><p>${start}</p></div>
      <div class="end-date"><p class="tournament-tittle">Koniec:</p><p>${end}</p></div>
      <div class="game-system"><p class="tournament-tittle">Sport:</p><p class="system">${t.sportName ?? '?'}</p></div>
      <div class="teams"><p class="tournament-tittle">Zespoly:</p><p class="count">?</p></div>
      <a href="tournaments.html" onclick="localStorage.setItem('searchedTournament','${t.id}');">
        <img src="img/style=linear.svg" alt="" style="height:20px;margin-top:40px">
      </a>
    `;
    cont.appendChild(el);

    // Подсчёт участников
    try {
      const tr = await fetch(`http://localhost:8765/competition/count-of-signed-in?competitionId=${t.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accToken')}` }
      });
      if (tr.ok) {
        const cnt = await tr.json();
        const span = el.querySelector('.teams .count');
        if (span) span.textContent = cnt;
      }
    } catch {
      // Оставляем "?" при ошибке
    }
  }
}

async function renderLeagues(leagues) {
  const cont = document.querySelector('.league-content');
  cont.innerHTML = '';
  for (const l of leagues) {
    const start = formatDateTime(l.startDate);
    const end = formatDateTime(l.endDate);
    const el = document.createElement('div');
    el.classList.add('league');
    el.innerHTML = `
      <div class="league-tittle">
        <img src="${l.bannerUrl}" alt="League Logo" style="border-radius: 8px;" onerror="this.src='img/blogo%202.png'">
        <div class="league-tittle-text">
          <div>
            <p style="font-weight:bold;margin-bottom:-5px">${l.name}</p>
            <p style="color:#808A9D;font-size:12px">${l.sportName ?? '?'}</p>
          </div>
          <a href="leagues.html" onclick="localStorage.setItem('searchedLeague','${l.id}');">
            <img src="img/style=linear.svg" alt="" style="height:20px">
          </a>
        </div>
      </div>
      <div class="options">
        <div class="start-date"><p class="tournament-tittle">Start:</p><p>${start}</p></div>
        <div class="end-date"><p class="tournament-tittle">Koniec:</p><p>${end}</p></div>
        <div class="game-system"><p class="tournament-tittle">Sport:</p><p class="system">${l.sportName ?? '?'}</p></div>
        <div class="teams"><p class="tournament-tittle">Zespoly:</p><p class="count">?</p></div>
      </div>
      <div class="top"></div>
    `;
    cont.appendChild(el);

    // Топ-3 и участники
    try {
      const tr = await fetch(`http://localhost:8765/competition/league-table/${l.id}`);
      if (tr.ok) {
        const data = await tr.json();
        data.sort((a, b) => b.wins - a.wins);
        const top3 = data.slice(0, 3);
        let count = data.length;
        if (count && data[0].playerId != null) count = data.filter(r => r.playerId != null).length;
        if (count && data[0].teamId != null) count = data.filter(r => r.teamId != null).length;
        const countSpan = el.querySelector('.teams .count');
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
        el.querySelector('.top').innerHTML = html;
      }
    } catch {}
  }
}

if (document.getElementById('log-out') !== null){
  const logOutBtn = document.getElementById('log-out').addEventListener('click',logOut);
}
/* ===================================================================== */
/*  e-sport-main-page.js  – блок работы с новостями                      */
/* ===================================================================== */

document.addEventListener('DOMContentLoaded', loadEsportNews);

/* ---------- вспомогательный fetch ----------------------------------- */
async function safeJson (res) {
  if (res.status === 204 || res.status === 205) return [];
  const txt = await res.text();
  return txt.trim() ? JSON.parse(txt) : [];
}

/* ---------- загружаем и строим слайды ------------------------------- */
async function loadEsportNews () {

  const track = document.querySelector('.news-track');
  if (!track) return;                         // на странице нет блока

  try {
    const token = localStorage.getItem('accToken') ?? '';

    /* 1. получаем закреплённые события */
    const resp   = await fetch('http://localhost:8765/event/pinned',
      { headers:{ Authorization:`Bearer ${token}` }});
    if (!resp.ok) throw new Error(resp.status);
    let events   = await safeJson(resp);

    /* 2. берём только GLOBAL + E-SPORT */
    events = events.filter(ev =>
      ev.category === 'GLOBAL' || ev.category === 'ESPORT');

    /* 3. сортируем по дате (сначала новые) */
    events.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    /* 4. генерируем HTML слайдов */
    track.innerHTML = '';
    for (const ev of events) {

      /* стараемся взять кастомную картинку события */
      let imgUrl = 'img/default-event.png';
      try {
        const r = await fetch(`http://localhost:8765/event/image/${ev.id}`,
          { headers:{ Authorization:`Bearer ${token}` }});
        if (r.ok) {
          const u = await r.text();
          if (u && !u.includes('minio:9000')) imgUrl = u;
        }
      } catch {/* ignore */ }

      const dateStr = new Date(ev.createdAt).toLocaleDateString('pl-PL',{
        year:'numeric',month:'2-digit',day:'2-digit'});

      track.insertAdjacentHTML('beforeend', `
       <div class="news-slide" data-id="${ev.id}" data-type="${ev.eventType}" data-type="${ev.eventType}" data-comp ="${ev.competitionId ?? ''}"
            style="background-image:url('${imgUrl}');">
            <p>${ev.title}</p>
            <time>${new Date(ev.createdAt)
        .toLocaleDateString('pl-PL',{year:'numeric',
          month:'2-digit',
          day:'2-digit'})}</time>
        </div>`);
    }

    initNewsSlider();        // активируем стрелки / листание
    initNewsNavigation();    // навигация по клику на слайд

  } catch (err) {
    console.error('News (e-sport) error:', err);
  }
}

/* ---------- простой слайдер ---------------------------------------- */
function initNewsSlider () {

  const track = document.querySelector('.news-track');
  const prev  = document.querySelector('.news-prev');
  const next  = document.querySelector('.news-next');
  if (!track || !prev || !next) return;

  const slideW   = 900 + 30;          // ширина слайда + gap (из CSS)
  const maxIndex = Math.max(0, track.children.length - 1);
  let   index    = 0;

  const update = () => {
    track.style.transform = `translateX(${-index * slideW}px)`;
    prev.disabled = (index === 0);
    next.disabled = (index === maxIndex);
  };

  prev.addEventListener('click', () => { if (index > 0)      { index--; update(); }});
  next.addEventListener('click', () => { if (index < maxIndex){ index++; update(); }});
  update();
}

/* ---------- переходы по клику на карточку -------------------------- */
function initNewsNavigation () {

  const track = document.querySelector('.news-track');
  if (!track) return;

  track.addEventListener('click', e => {
    const slide = e.target.closest('.news-slide');
    if (!slide) return;

    const type  = slide.dataset.type;     // GLOBAL | LEAGUE | TOURNAMENT | MATCH …
    const match = slide.dataset.match;
    const comp  = slide.dataset.comp;

    if (match) {                          //  🔸 матч
      localStorage.setItem('searchedMatch', match);
      location.href = 'match-page.html';
      return;
    }

    if (comp) {                           //  🔸 лига или турнир
      if (type === 'LEAGUE') {
        localStorage.setItem('searchedLeague', comp);
        location.href = 'leagues.html';
      } else {                            //  считаем остальное турниром
        localStorage.setItem('searchedTournament', comp);
        location.href = 'tournaments.html';
      }
    }
    /* GLOBAL –– остаёмся на странице */
  });
}
