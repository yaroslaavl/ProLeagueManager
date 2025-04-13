document.addEventListener('DOMContentLoaded', loadMainPageCompetitions);

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
    //    Если текст в элементе с id sportyButton равен "Sporty", то это обычный спорт, иначе е-спорт.
    const sportyText = document.getElementById("sportyButton")?.textContent.trim();
    const isEsportRequired = (sportyText && sportyText.toLowerCase() !== "sporty");

    // Фильтруем соревнования по признаку вида спорта
    competitions = competitions.filter(c => c.isEsport === isEsportRequired);

    // 4) Сортируем соревнования — сначала по названию спорта, затем по дате начала
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

    // 7) Отрисовка турниров в блоке с классом .tournaments
    const tournamentsContainer = document.querySelector('.tournaments');
    tournamentsContainer.innerHTML = ''; // Чистим заглушки

    tournaments.forEach(tournament => {
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
    });

    // 8) Отрисовка лиг в блоке с классом .league-content
    const leaguesContainer = document.querySelector('.league-content');
    leaguesContainer.innerHTML = ''; // Чистим заглушки

    leagues.forEach(league => {
      const startDateStr = formatDateTime(league.startDate);
      const endDateStr = formatDateTime(league.endDate);
      const leagueEl = document.createElement('div');
      leagueEl.classList.add('league');
      leagueEl.innerHTML = `
        <div class="league-tittle">
          <img src="img/google-logo.png" alt="League Logo">
          <div class="league-tittle-text">
            <div>
              <p style="font-weight: bold;margin-bottom: -5px">${league.name}</p>
              <p style="color: #808A9D;font-size: 12px">${league.sportName ?? "?"}</p>
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
          <!-- Можно добавить динамику для топ-игроков -->
        </div>
      `;
      leaguesContainer.appendChild(leagueEl);
    });

  } catch (err) {
    console.error('Ошибка при загрузке данных соревнований:', err);
  }
}

/**
 * Функция форматирования даты и времени.
 * Преобразует строку даты в формат, например: "12.04.2025, 15:30".
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
