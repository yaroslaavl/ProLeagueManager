document.addEventListener('DOMContentLoaded', loadMainPageCompetitions);
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

async function loadMainPageCompetitions() {
  try {
    const accToken = localStorage.getItem("accToken");

    // 1) Получаем все соревнования
    const competitionsResponse = await fetch('http://localhost:8765/competition/all', {
      headers: { 'Authorization': `Bearer ${accToken}` }
    });
    if (!competitionsResponse.ok) {
      throw new Error(`Ошибка при получении соревнований: ${competitionsResponse.status}`);
    }
    let competitions = await competitionsResponse.json();

    // 2) Для каждого соревнования получаем данные о спорте
    for (const competition of competitions) {
      try {
        const sportResponse = await fetch(`http://localhost:8765/sport/id/${competition.sportId}`);
        if (sportResponse.ok) {
          const sportData = await sportResponse.json();
          competition.sportName = sportData.name;
          competition.isEsport = sportData.isEsport;
        } else {
          competition.sportName = 'Nieznany sport';
          competition.isEsport = false;
        }
      } catch {
        competition.sportName = 'Nieznany sport';
        competition.isEsport = false;
      }
    }

    // 3) Определяем тип (спорт или е-спорт)
    const sportyText = document.getElementById("sportyButton")?.textContent.trim();
    const isEsportRequired = (sportyText && sportyText.toLowerCase() !== "sporty");
    competitions = competitions.filter(c => c.isEsport === isEsportRequired);

    // 4) Сортируем
    competitions.sort((a, b) => {
      if (a.sportName < b.sportName) return -1;
      if (a.sportName > b.sportName) return 1;
      return new Date(a.startDate) - new Date(b.startDate);
    });

    // 5) Разделяем на турниры и лиги
    let tournaments = competitions.filter(c => c.competitionType === 'TOURNAMENT');
    let leagues     = competitions.filter(c => c.competitionType === 'LEAGUE');

    // 6) Оставляем только нужное количество
    tournaments = tournaments.slice(0, 3);
    leagues     = leagues.slice(0, 2);

    // 7) Рендер турниров
    const tournamentsContainer = document.querySelector('.tournaments');
    tournamentsContainer.innerHTML = '';
    for (const tournament of tournaments) {
      const startDateStr = formatDateTime(tournament.startDate);
      const endDateStr   = formatDateTime(tournament.endDate);
      const tournamentEl = document.createElement('div');
      tournamentEl.classList.add('tournament');
      tournamentEl.innerHTML = `
        <img src="img/google-logo.png" alt="Tournament Logo">
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
        </a>
      `;
      tournamentsContainer.appendChild(tournamentEl);

      // Подсчёт участников
      try {
        const tableResp = await fetch(`http://localhost:8765/competition/league-table/${tournament.id}`);
        if (tableResp.ok) {
          const tableData = await tableResp.json();
          let count = tableData.length;
          if (count && tableData[0].playerId != null) {
            count = tableData.filter(r => r.playerId != null).length;
          } else if (count && tableData[0].teamId != null) {
            count = tableData.filter(r => r.teamId != null).length;
          }
          const span = tournamentEl.querySelector('.teams .count');
          if (span) span.textContent = count;
        }
      } catch { /* оставляем пустым */ }
    }

    // 8) Рендер лиг
    const leaguesContainer = document.querySelector('.league-content');
    leaguesContainer.innerHTML = '';
    for (const league of leagues) {
      const startDateStr = formatDateTime(league.startDate);
      const endDateStr   = formatDateTime(league.endDate);
      const leagueEl = document.createElement('div');
      leagueEl.classList.add('league');
      leagueEl.innerHTML = `
        <div class="league-tittle">
          <img src="img/google-logo.png" alt="League Logo">
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
        <div class="top"></div>
      `;
      leaguesContainer.appendChild(leagueEl);

      // Подгружаем таблицу и топ‑3
      try {
        const resp = await fetch(`http://localhost:8765/competition/league-table/${league.id}`);
        if (resp.ok) {
          const table = await resp.json();
          table.sort((a,b) => b.wins - a.wins);
          const top3 = table.slice(0,3);
          let count = table.length;
          if (count && table[0].playerId!=null) count = table.filter(r=>r.playerId!=null).length;
          if (count && table[0].teamId !=null) count = table.filter(r=>r.teamId!=null).length;
          const countSpan = leagueEl.querySelector('.teams .count');
          if (countSpan) countSpan.textContent = count;

          let html = '';
          for (const row of top3) {
            if (row.playerId) {
              const u = await (await fetch(`http://localhost:8765/user/getUser/${row.playerId}`)).json();
              const avatar = `http://localhost:8765/user/avatar/${u.username}`;
              html += `
                <div class="player">
                  <div class="player-info">
                    <img src="${avatar}" alt="Player">
                    <p class="player-name">${u.username}</p>
                  </div>
                  <div class="win-count">
                    <p>Ilosc zwycienstw:</p>
                    <p class="count">${row.wins ?? '?'}</p>
                  </div>
                </div>`;
            }
          }
          leagueEl.querySelector('.top').innerHTML = html;
        }
      } catch { /* silently */ }
    }

  } catch (err) {
    console.error('Ошибка при загрузке данных соревнований:', err);
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('pl-PL', {
    year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}
