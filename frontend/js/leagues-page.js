// Если токены присутствуют, пытаемся обновить их
if (localStorage.getItem('accToken') !== null && localStorage.getItem('refToken') !== null) {
  refreshToken();
}

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

// Проверка наличия токенов
let accToken = localStorage.getItem("accToken");
let refToken = localStorage.getItem("refToken");
if (accToken === null || refToken === null) {
  const notifBtn = document.getElementById("notification_button");
  const burgerAndUser = document.getElementById("header_right");
  while (burgerAndUser.firstChild) {
    burgerAndUser.removeChild(burgerAndUser.firstChild);
  }
  while (notifBtn.firstChild) {
    notifBtn.removeChild(notifBtn.firstChild);
  }
  burgerAndUser.innerHTML = `
    <a href="login.html">
      <div class="registerBtn">
        <button class="register">Zaloguj sie</button>
      </div>
    </a>
  `;
  burgerAndUser.style.backgroundColor = "white";
}

// Функция обновления токена
async function refreshToken() {
  try {
    const url = "http://localhost:8765/auth/refresh-token";
    const refToken = localStorage.getItem("refToken");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${refToken}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) throw new Error("Error Refresh Token");
    const Tokens = await response.json();
    localStorage.setItem("accToken", Tokens.accessToken);
    localStorage.setItem("refToken", Tokens.refreshToken);
  } catch (err) {
    console.error(err);
  }
}

// Функция выхода из системы
async function logOut() {
  try {
    let accToken = localStorage.getItem("accToken");
    let refToken = localStorage.getItem("refToken");
    const response = await fetch("http://localhost:8765/auth/logout", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    localStorage.clear();
    window.location.href = "main.html";
  } catch (err) {
    console.error(`${err}`);
  }
}

// Привязываем событие на кнопку "Log Out", если она есть
if (document.getElementById('log-out') !== null) {
  document.getElementById('log-out').addEventListener('click', logOut);
}

/**
 * Функция получения лиг по фильтрам.
 * Пример запроса:
 * http://localhost:8765/competition/search-leagues?isIndividual=false&status=ACTIVE&isEsport=true
 */
async function getLeaguesByFilter() {
  try {
    const active = document.getElementById('active').checked;
    const past = document.getElementById('past').checked;       // пока не используется напрямую
    const future = document.getElementById('future').checked;   // пока не используется напрямую
    const isIndividual = document.getElementById('isIndividual').checked;
    let isEsport = (document.getElementById('sportyButton').textContent === 'Sporty') ? false : true;

    // Простейшая логика для определения статуса; можно расширить с учетом past/future
    const statusParam = active ? 'ACTIVE' : 'UPCOMING';

    const response = await fetch(
      `http://localhost:8765/competition/search-leagues?isIndividual=${isIndividual}&status=${statusParam}&isEsport=${isEsport}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("accToken")}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching leagues: ${response.status}`);
    }

    let data = await response.json();
    console.log(data);
    addLeaguesToTheList(data);

  } catch (err) {
    console.error(`Error while receiving leagues: ${err}`);
  }
}

/**
 * Функция добавления лиг в список.
 * Для корректного применения стилей создается блок с классом "tournament"
 * (так как в CSS стили карточек заданы для .tournament).
 */
async function addLeaguesToTheList(receivedData) {
  try {
    const list = document.getElementById('leagues-list');
    list.innerHTML = '';

    for (const league of receivedData) {
      // Параллельно получаем данные игровой системы и изображение
      const [systemResponse, imageResponse] = await Promise.all([
        fetch(`http://localhost:8765/game-system/${league.gameSystemId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem("accToken")}` }
        }),
        fetch(`http://localhost:8765/competition/get-image/${league.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem("accToken")}` }
        })
      ]);

      const system = systemResponse.ok ? await systemResponse.json() : null;
      const imageUrl = imageResponse.ok ? await imageResponse.text() : 'img/google-logo.svg';

      // Функция форматирования даты
      const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("pl-PL");
      };

      // Создаем карточку лиги с классом "tournament" для применения заданных стилей
      const leagueEl = document.createElement('div');
      leagueEl.classList.add('tournament');
      leagueEl.innerHTML = `
        <div>
          <img src="${imageUrl}" alt="Liga" style="border-radius: 10px">
          <div class="tournament-name">
            <p class="name">${league.name}</p>
            <p class="status">${league.status}</p>
          </div>
        </div>
        <div style="gap:40px;margin-right: 20px">
          <div class="start-time">
            <p>Start:</p>
            <p class="start-date">${formatDate(league.startDate)}</p>
          </div>
          <div class="end-time">
            <p>Koniec:</p>
            <p class="end-date">${formatDate(league.endDate)}</p>
          </div>
          <div class="game-system">
            <p>Tryb:</p>
            <p class="system">${system?.systemName ?? "-"}</p>
          </div>
          <div class="teams">
            <p>Zespoly:</p>
            <p class="count">${system?.minTeamSize ?? "?"}/${system?.maxTeamSize ?? "?"}</p>
          </div>
          <a href=""><img src="img/style=linear.svg" alt="" style="height: 20px;margin-top: 40px"></a>
        </div>
      `;
      list.appendChild(leagueEl);
    }

  } catch (err) {
    console.error(`Error while adding leagues to the list: ${err}`);
  }
}
