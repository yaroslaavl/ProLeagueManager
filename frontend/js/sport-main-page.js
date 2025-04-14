document.addEventListener('DOMContentLoaded', loadMainPageCompetitions);
document.addEventListener("DOMContentLoaded", () => {
  const pageLoadSpan = document.querySelector(".footer-content span:nth-child(3)");
  const htmlLoadSpan = document.querySelector(".footer-content span:nth-child(4)");

  if (pageLoadSpan && htmlLoadSpan) {
    // Ждем полной загрузки страницы
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
      headers: {
        'Authorization': `Bearer ${accToken}`
      }
    });
    if (!competitionsResponse.ok) {
      throw new Error(`Ошибка при получении соревнований: ${competitionsResponse.status}`);
    }
    let competitions = await competitionsResponse.json();

    // 2) Для каждого соревнования получаем данные о спорте по его sportId
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
      } catch (err) {
        console.error(`Ошибка при получении спорта для competitionId=${competition.id}`, err);
        competition.sportName = 'Nieznany sport';
        competition.isEsport = false;
      }
    }

    // 3) Определяем, на какой странице мы находимся (Sporty или E-sporty)
    // Если текст в элементе с id "sportyButton" равен "Sporty", то это обычный спорт, иначе — е-спорт.
    const sportyText = document.getElementById("sportyButton")?.textContent.trim();
    const isEsportRequired = (sportyText && sportyText.toLowerCase() !== "sporty");
    competitions = competitions.filter(c => c.isEsport === isEsportRequired);

    // 4) Сортируем соревнования — сначала по sportName, затем по дате начала
    competitions.sort((a, b) => {
      if (a.sportName < b.sportName) return -1;
      if (a.sportName > b.sportName) return 1;
      return new Date(a.startDate) - new Date(b.startDate);
    });

    // 5) Разделяем соревнования на турниры и лиги
    let tournaments = competitions.filter(c => c.competitionType === 'TOURNAMENT');
    let leagues = competitions.filter(c => c.competitionType === 'LEAGUE');

    // 6) Оставляем только 3 ближайших турнира и 2 ближайшие лиги
    tournaments = tournaments.slice(0, 3);
    leagues = leagues.slice(0, 2);

    // 7) Отрисовка турниров в контейнере с классом .tournaments
    const tournamentsContainer = document.querySelector('.tournaments');
    tournamentsContainer.innerHTML = ''; // Очищаем заглушки
    tournaments.forEach(async (tournament) => {
      const startDateStr = formatDateTime(tournament.startDate);
      const endDateStr = formatDateTime(tournament.endDate);
      const tournamentEl = document.createElement('div');
      tournamentEl.classList.add('tournament');
      tournamentEl.innerHTML = `
        <img src="img/google-logo.png" alt="Tournament Logo">
        <div class="tournament-name">
          <p class="tournament-tittle" style="font-weight: bold;color: #000000">${tournament.name}</p>
          <p class="status">${tournament.status}</p>
        </div>
        <div class="start-date">
          <p class="tournament-tittle">Start:</p>
          <p>${startDateStr}</p>
        </div>
        <div class="end-date">
          <p class="tournament-tittle">Koniec:</p>
          <p>${endDateStr}</p>
        </div>
        <div class="game-system">
          <p class="tournament-tittle">Sport:</p>
          <p class="system">${tournament.sportName ?? "?"}</p>
        </div>
        <div class="teams">
          <p class="tournament-tittle">Zespoly:</p>
          <p class="count">?</p>
        </div>
        <a href="">
          <img src="img/style=linear.svg" alt="" style="height: 20px;margin-top: 40px">
        </a>
      `;
      tournamentsContainer.appendChild(tournamentEl);

      // Обновляем количество участников турнира по методу league table (аналогично лигам)
      try {
        const tableResponse = await fetch(`http://localhost:8765/competition/league-table/${tournament.id}`);
        if (tableResponse.ok) {
          const tableData = await tableResponse.json();
          // Подсчитываем число участников (если используется playerId или teamId)
          let participantCount = tableData.length;
          if (tableData.length > 0) {
            if (tableData[0].playerId != null) {
              participantCount = tableData.filter(r => r.playerId != null).length;
            } else if (tableData[0].teamId != null) {
              participantCount = tableData.filter(r => r.teamId != null).length;
            }
          }
          const countSpan = tournamentEl.querySelector('.teams .count');
          if (countSpan) {
            countSpan.textContent = participantCount;
          }
        } else {
          // Если не удалось получить данные — оставляем пустым
          const countSpan = tournamentEl.querySelector('.teams .count');
          if (countSpan) {
            countSpan.textContent = '';
          }
        }
      } catch (err) {
        console.error(`Ошибка при получении данных турнира league-table для tournamentId=${tournament.id}`, err);
        const countSpan = tournamentEl.querySelector('.teams .count');
        if (countSpan) {
          countSpan.textContent = '';
        }
      }
    });

    // 8) Отрисовка лиг в контейнере с классом .league-content
    const leaguesContainer = document.querySelector('.league-content');
    leaguesContainer.innerHTML = '';
    leagues.forEach(async (league) => {
      const startDateStr = formatDateTime(league.startDate);
      const endDateStr = formatDateTime(league.endDate);

      // Создаем базовую карточку лиги
      const leagueEl = document.createElement('div');
      leagueEl.classList.add('league');
      leagueEl.innerHTML = `
        <div class="league-tittle">
          <img src="img/google-logo.png" alt="League Logo">
          <div class="league-tittle-text">
            <div>
              <p style="font-weight: bold;margin-bottom: -5px">${league.name}</p>
              <p style="color: #808A9D;font-size: 12px">${league.sportName ?? "?"}</p>
              <!-- Здесь будет отображаться количество участников -->
            </div>
            <a href="">
              <img src="img/style=linear.svg" alt="" style="height: 20px;">
            </a>
          </div>
        </div>
        <div class="options">
          <div class="start-date">
            <p class="tournament-tittle">Start:</p>
            <p>${startDateStr}</p>
          </div>
          <div class="end-date">
            <p class="tournament-tittle">Koniec:</p>
            <p>${endDateStr}</p>
          </div>
          <div class="game-system">
            <p class="tournament-tittle">Sport:</p>
            <p class="system">${league.sportName ?? "?"}</p>
          </div>
          <div class="teams">
            <p class="tournament-tittle">Zespoly:</p>
            <p class="count">?</p>
          </div>
        </div>
        <div class="top">
          <!-- Если нет данных о топ graczach, блок останется пустым -->
        </div>
      `;
      leaguesContainer.appendChild(leagueEl);

      // Подгружаем таблицу лиги для данной лиги и обновляем количество участников
      try {
        const leagueTableResponse = await fetch(`http://localhost:8765/competition/league-table/${league.id}`);
        if (leagueTableResponse.ok) {
          const leagueTable = await leagueTableResponse.json();

          // Сортируем таблицу по количеству побед (wins) по убыванию
          leagueTable.sort((a, b) => b.wins - a.wins);
          const topThree = leagueTable.slice(0, 3);

          // Подсчитываем число участников
          let participantCount = leagueTable.length;
          if (leagueTable.length > 0) {
            if (leagueTable[0].playerId != null) {
              participantCount = leagueTable.filter(r => r.playerId != null).length;
            } else if (leagueTable[0].teamId != null) {
              participantCount = leagueTable.filter(r => r.teamId != null).length;
            }
          }
          // Записываем число участников в блок .count внутри .teams
          const countSpan = leagueEl.querySelector('.teams .count');
          if (countSpan) {
            countSpan.textContent = participantCount;
          }

          // Формируем HTML для топ-3 участников
          let playersHtml = '';
          for (const row of topThree) {
            if (row.playerId) {
              try {
                const userResponse = await fetch(`http://localhost:8765/user/getUser/${row.playerId}`);
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  const username = userData.username || 'unknown_user';
                  // Получаем аватар по URL /user/avatar/{username}
                  const avatarUrl = `http://localhost:8765/user/avatar/${username}`;
                  playersHtml += `
                    <div class="player">
                      <div class="player-info">
                        <img src="${avatarUrl}" alt="Player">
                        <p class="player-name">${username}</p>
                      </div>
                      <div class="win-count">
                        <p>Ilosc zwycienstw:</p>
                        <p class="count">${row.wins ?? '?'}</p>
                      </div>
                    </div>
                  `;
                }
              } catch (err) {
                console.error(`Ошибка при получении игрокa ID=${row.playerId}`, err);
              }
            } else if (row.teamId) {
              // Если для команды — здесь можно добавить аналогичный блок
            }
          }
          // Если playersHtml не заполнен, оставляем блок пустым
          const topContainer = leagueEl.querySelector('.top');
          topContainer.innerHTML = playersHtml || '';
        } else {
          const topContainer = leagueEl.querySelector('.top');
          topContainer.innerHTML = '';
        }
      } catch (err) {
        console.error(`Ошибка при получении таблицы лigi leagueId=${league.id}`, err);
        const topContainer = leagueEl.querySelector('.top');
        topContainer.innerHTML = '';
      }
    });

  } catch (err) {
    console.error('Ошибка при загрузке данных соревнований:', err);
  }
}

/**
 * Функция форматирования даты и времени в формате "DD.MM.YYYY, HH:MM"
 */
function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr);
  return dateObj.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
