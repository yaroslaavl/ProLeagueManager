// файл: js/esport-main-page.js

document.addEventListener('DOMContentLoaded', loadMainPageCompetitions);
document.addEventListener("DOMContentLoaded", () => {
  const pageLoadSpan = document.querySelector(".footer-content span:nth-child(3)");
  const htmlLoadSpan = document.querySelector(".footer-content span:nth-child(4)");

  if (pageLoadSpan && htmlLoadSpan) {
    window.addEventListener("load", () => {
      setTimeout(() => {
        const pt = performance.timing;
        const pageLoadTime = pt.loadEventEnd - pt.navigationStart;
        const htmlLoadTime = pt.responseEnd - pt.responseStart;
        const validPage = pageLoadTime > 0 ? pageLoadTime : performance.now();
        const validHtml = htmlLoadTime > 0 ? htmlLoadTime : 0;
        pageLoadSpan.innerHTML = `Strona: <span class="blue">${Math.round(validPage)}ms</span>`;
        htmlLoadSpan.innerHTML = `Szablon: <span class="blue">${Math.round(validHtml)}ms</span>`;
      }, 0);
    });
  }
});

async function loadMainPageCompetitions() {
  try {
    const accToken = localStorage.getItem("accToken");
    const resp = await fetch('http://localhost:8765/competition/all', {
      headers: { 'Authorization': `Bearer ${accToken}` }
    });
    if (!resp.ok) throw new Error(`Ошибка: ${resp.status}`);
    let comps = await resp.json();

    // Получаем sportName и isEsport
    await Promise.all(comps.map(async c => {
      try {
        const s = await fetch(`http://localhost:8765/sport/id/${c.sportId}`);
        if (s.ok) {
          const sd = await s.json();
          c.sportName = sd.name;
          c.isEsport   = sd.isEsport;
        }
      } catch {}
    }));

    // Оставляем только е‑спорт
    comps = comps.filter(c => c.isEsport === true);

    // Сортировка
    comps.sort((a,b) => {
      if (a.sportName < b.sportName) return -1;
      if (a.sportName > b.sportName) return  1;
      return new Date(a.startDate) - new Date(b.startDate);
    });

    // Разделяем
    let tours  = comps.filter(c => c.competitionType === 'TOURNAMENT').slice(0,3);
    let leagues = comps.filter(c => c.competitionType === 'LEAGUE').slice(0,2);

    renderTournaments(tours);
    renderLeagues(leagues);

  } catch (err) {
    console.error(err);
  }
}

function formatDateTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('pl-PL', {
    year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit'
  });
}

async function renderTournaments(tours) {
  const cont = document.querySelector('.tournaments');
  cont.innerHTML = '';
  for (const t of tours) {
    const start = formatDateTime(t.startDate);
    const end   = formatDateTime(t.endDate);
    const el = document.createElement('div');
    el.classList.add('tournament');
    el.innerHTML = `
      <img src="img/google-logo.png" alt="">
      <div class="tournament-name">
        <p class="tournament-tittle" style="font-weight:bold;color:#000">${t.name}</p>
        <p class="status">${t.status}</p>
      </div>
      <div class="start-date"><p class="tournament-tittle">Start:</p><p>${start}</p></div>
      <div class="end-date"><p class="tournament-tittle">Koniec:</p><p>${end}</p></div>
      <div class="game-system"><p class="tournament-tittle">Sport:</p><p class="system">${t.sportName}</p></div>
      <div class="teams"><p class="tournament-tittle">Zespoly:</p><p class="count">?</p></div>
      <a href="tournaments.html"
         onclick="localStorage.setItem('searchedTournament','${t.id}');">
        <img src="img/style=linear.svg" alt="" style="height:20px;margin-top:40px">
      </a>
    `;
    cont.appendChild(el);

    // подсчёт участников
    try {
      const tr = await fetch(`http://localhost:8765/competition/league-table/${t.id}`);
      if (tr.ok) {
        const data = await tr.json();
        let cnt = data.length;
        if (cnt && data[0].playerId != null) cnt = data.filter(r=>r.playerId!=null).length;
        if (cnt && data[0].teamId   != null) cnt = data.filter(r=>r.teamId  !=null).length;
        el.querySelector('.teams .count').textContent = cnt;
      }
    } catch {}
  }
}

async function renderLeagues(leagues) {
  const cont = document.querySelector('.league-content');
  cont.innerHTML = '';
  for (const l of leagues) {
    const start = formatDateTime(l.startDate);
    const end   = formatDateTime(l.endDate);
    const el = document.createElement('div');
    el.classList.add('league');
    el.innerHTML = `
      <div class="league-tittle">
        <img src="img/google-logo.png" alt="">
        <div class="league-tittle-text">
          <div>
            <p style="font-weight:bold;margin-bottom:-5px">${l.name}</p>
            <p style="color:#808A9D;font-size:12px">${l.sportName}</p>
          </div>
          <a href="leagues.html"
             onclick="localStorage.setItem('searchedLeague','${l.id}');">
            <img src="img/style=linear.svg" alt="" style="height:20px">
          </a>
        </div>
      </div>
      <div class="options">
        <div class="start-date"><p class="tournament-tittle">Start:</p><p>${start}</p></div>
        <div class="end-date"><p class="tournament-tittle">Koniec:</p><p>${end}</p></div>
        <div class="game-system"><p class="tournament-tittle">Sport:</p><p class="system">${l.sportName}</p></div>
        <div class="teams"><p class="tournament-tittle">Zespoly:</p><p class="count">?</p></div>
      </div>
      <div class="top"></div>
    `;
    cont.appendChild(el);

    // топ‑3 и участники
    try {
      const tr = await fetch(`http://localhost:8765/competition/league-table/${l.id}`);
      if (tr.ok) {
        const data = await tr.json();
        data.sort((a,b)=>b.wins-a.wins);
        const top3 = data.slice(0,3);
        let cnt = data.length;
        if (cnt && data[0].playerId!=null) cnt = data.filter(r=>r.playerId!=null).length;
        if (cnt && data[0].teamId  !=null) cnt = data.filter(r=>r.teamId  !=null).length;
        el.querySelector('.teams .count').textContent = cnt;

        let html = '';
        for (const row of top3) {
          if (row.playerId) {
            const u = await (await fetch(`http://localhost:8765/user/getUser/${row.playerId}`)).json();
            html += `
              <div class="player">
                <div class="player-info">
                  <img src="http://localhost:8765/user/avatar/${u.username}" alt="">
                  <p class="player-name">${u.username}</p>
                </div>
                <div class="win-count">
                  <p>Ilosc zwycienstw:</p>
                  <p class="count">${row.wins}</p>
                </div>
              </div>`;
          }
        }
        el.querySelector('.top').innerHTML = html;
      }
    } catch {}
  }
}
