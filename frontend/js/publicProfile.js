document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Проверяем наличие токенов
    const accToken = localStorage.getItem("accToken");
    const refToken = localStorage.getItem("refToken");

    if (!accToken || !refToken) {
      window.location.href = "main.html";
      return;
    }

    // Обновляем токены перед загрузкой данных
    await refreshToken();

    // Загружаем данные пользователя
    await getUserData();

    // Устанавливаем обработчик на загрузку страницы для метрик
    setupPageLoadMetrics();

  } catch (err) {
    console.error("Ошибка при загрузке страницы:", err);
  }
});

// Функция обновления токена
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

// Функция получения данных пользователя
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

    // Устанавливаем данные пользователя в UI
    document.getElementById('first_last_name').innerHTML = `${data.firstName} ${data.lastName}`;
    document.getElementById("nickname").innerHTML = data.username;
    document.getElementById("date_of_birth").innerHTML = data.birthDate.split('-').reverse().join('.');
    document.getElementById("creation-date").innerHTML = new Date(data.createdAt).toLocaleDateString();

    // Загружаем команды пользователя
    await getTeam(data.id);

    // Загружаем аватар
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

// Функция выхода из системы
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

// Функция загрузки команд пользователя
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

// Функция измерения времени загрузки страницы
function setupPageLoadMetrics() {
  const pageLoadSpan = document.querySelector(".footer-content span:nth-child(3)");
  const htmlLoadSpan = document.querySelector(".footer-content span:nth-child(4)");

  if (pageLoadSpan && htmlLoadSpan) {
    window.addEventListener("load", () => {
      setTimeout(() => {
        const timing = performance.timing;

        const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        const htmlLoadTime = timing.responseEnd - timing.responseStart;

        const validPageLoadTime = pageLoadTime > 0 ? pageLoadTime : performance.now();
        const validHtmlLoadTime = htmlLoadTime > 0 ? htmlLoadTime : 0;

        pageLoadSpan.innerHTML = `Strona: <span class="blue">${Math.round(validPageLoadTime)}ms</span>`;
        htmlLoadSpan.innerHTML = `Szablon: <span class="blue">${Math.round(validHtmlLoadTime)}ms</span>`;

        console.log("Page Load Time (ms):", validPageLoadTime);
        console.log("HTML Load Time (ms):", validHtmlLoadTime);
      }, 0);
    });
  }
}

// Обработчик для кнопки создания команды
document.addEventListener("DOMContentLoaded", function () {
  const createTeamBtn = document.getElementById("create_team_btn");
  if (createTeamBtn) {
    createTeamBtn.addEventListener("click", openCreateTeamDialog);
  } else {
    console.error("Кнопка создания команды не найдена в DOM");
  }
});

function openCreateTeamDialog() {
  // Создание затемненного фона
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

  // Создание диалогового окна
  const dialog = document.createElement("div");
  dialog.style.background = "#fff";
  dialog.style.padding = "20px 20px";
  dialog.style.borderRadius = "8px";
  dialog.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  dialog.style.minWidth = "400px";
  dialog.style.textAlign = "center";

  // Заголовок
  const title = document.createElement("h2");
  title.textContent = "Stworzenie zespolu";
  const paragraph = document.createElement("p");
  paragraph.innerHTML = "Wpisz nazwę swojego zespołu.<br>Pamiętaj, że wulgarna nazwa zespołu spowoduje:<br> - zablokowanie<br> - usunięcie zespołu<br> - zablokowanie twórcy zespołu!";
  paragraph.style.color = "#808A9D";
  paragraph.style.textIndent = "20px";

  // Поле ввода
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Nazwa zespołu";
  input.style.width = "80%";
  input.style.padding = "8px";
  input.style.margin = "10px 0";
  input.style.border = "1px solid #ccc";
  input.style.borderRadius = "4px";

  // Кнопка подтверждения
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

  // Кнопка закрытия окна
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
