/**
 * open-profile.js
 *
 * Код для публичного профиля (просмотр чужого пользователя).
 * 1) Берёт из localStorage ключ "searchedProfile" (username, который хотим отобразить).
 * 2) Делает запрос GET /user/profile/public/{username}, чтобы получить публичные данные (id, firstName...).
 * 3) Заполняет страницу (аватар, ФИО, ник, дата рождения, дата создания).
 * 4) По userId запрашивает GET /team/get-teams-by-userId?userId=... и отображает команды.
 * 5) Для каждой команды — запрашиваем роли пользователя через
 *    GET /team/get-team-member-by-team-and-userId?teamId=...&userId=...
 * 6) На закрытие вкладки или переход куда-то удаляем "searchedProfile" из localStorage.
 */
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
document.addEventListener('DOMContentLoaded', () => {
  // 1) Считываем из localStorage искомый логин/юзернэйм
  const searchedUsername = localStorage.getItem('searchedProfile');
  if (!searchedUsername) {
    console.warn('Нет searchedProfile в localStorage!');
    window.location.href = 'main.html';
    return;
  }

  // 2) Загружаем публичные данные
  loadPublicUserData(searchedUsername);

  // 3) На закрытие вкладки/переход - удаляем searchedProfile (по желанию)
  window.addEventListener('beforeunload', () => {
    localStorage.removeItem('searchedProfile');
  });
});

/**
 * Запрашиваем публичные данные пользователя по юзернэйму.
 */
async function loadPublicUserData(username) {
  try {
    // Пример: GET /user/profile/public/{username}
    const response = await fetch(`http://localhost:8765/user/profile/public/${username}`, {
      method: 'GET'
    });
    if (!response.ok) {
      throw new Error(`Ошибка при запросе публичного профиля: ${response.status}`);
    }

    const data = await response.json();
    console.log('Публичные данные пользователя:', data);
    // Пример структуры data:
    // {
    //   "id": 4,
    //   "username": "Tester",
    //   "firstName": "Tester",
    //   "lastName": "Testerov",
    //   "birthDate": "2008-01-01",
    //   "avatar": "http://...png",
    //   "createdAt": "2025-01-28T23:05:46.69417"
    // }

    // 1) Заполняем ФИО, ник, даты
    document.getElementById('first_last_name').textContent = `${data.firstName} ${data.lastName}`;
    document.getElementById('nickname').textContent = data.username;

    // Дата рождения (YYYY-MM-DD -> DD.MM.YYYY)
    if (data.birthDate) {
      const [yyyy, mm, dd] = data.birthDate.split('-');
      document.getElementById('date_of_birth').textContent = `${dd}.${mm}.${yyyy}`;
    }
    // Дата создания профиля
    if (data.createdAt) {
      const dateObj = new Date(data.createdAt);
      document.getElementById('creation-date').textContent = dateObj.toLocaleDateString();
    }
    // Аватар
    if (data.avatar) {
      document.getElementById('profile_img').src = data.avatar;
    }

    // 2) Загружаем команды пользователя (используем userId из data.id)
    if (data.id) {
      loadPublicUserTeamsByUserId(data.id);
    }
  } catch (err) {
    console.error('Ошибка при загрузке публичного профиля:', err);
    // Перенаправляем на главную или показываем ошибку
    // window.location.href = 'main.html';
  }
}

/**
 * Запрашиваем команды по userId: GET /team/get-teams-by-userId?userId=...
 * По ответу отрисовываем их в #teams-container.
 * Затем для каждой команды делаем доп.запрос
 * GET /team/get-team-member-by-team-and-userId?teamId=...&userId=...
 * чтобы загрузить роли.
 */
async function loadPublicUserTeamsByUserId(userId) {
  try {
    const url = `http://localhost:8765/team/get-teams-by-userId?userId=${userId}`;
    const response = await fetch(url, {
      method: 'GET'
      // Если нужен заголовок Authorization, добавить:
      // headers: { 'Authorization': 'Bearer ...' }
    });
    if (!response.ok) {
      console.warn('Не удалось загрузить команды публичного пользователя');
      return;
    }

    const teams = await response.json();
    console.log('Команды пользователя (public):', teams);

    const teamsContainer = document.getElementById('teams-container');
    teamsContainer.innerHTML = '';

    if (!teams || teams.length === 0) {
      // Нет команд
      return;
    }

    // Перебираем массив команд
    for (const team of teams) {
      // Создаем div-контейнер для одной команды
      const teamEl = document.createElement('div');
      teamEl.classList.add('teams');

      // Логотип команды
      const teamImg = document.createElement('img');
      teamImg.alt = 'Team_avatar';
      // Пытаемся загрузить реальный логотип
      try {
        const logoResponse = await fetch(`http://localhost:8765/team/team-logo/${team.id}`);
        if (logoResponse.ok) {
          teamImg.src = await logoResponse.text();
        } else {
          teamImg.src = 'img/default-team-avatar.png';
        }
      } catch (err) {
        console.error('Ошибка при загрузке логотипа команды:', err);
        teamImg.src = 'img/default-team-avatar.png';
      }

      // Название команды
      // Вместо простого <p> с названием команды создаём ссылку
      const teamNameLink = document.createElement("a");
      teamNameLink.href = "public-teamPage.html"; // переход на публичную страницу команды
      teamNameLink.textContent = team.teamName;
      teamNameLink.style.color = "#000000";
      teamNameLink.style.fontWeight = "bold";
// При клике сохраняем в localStorage "searchedTeam"
      teamNameLink.addEventListener("click", () => {
        localStorage.setItem("searchedTeam", team.teamName);
      });


      // Плейсхолдер для вывода ролей
      const roleP = document.createElement('p');
      roleP.textContent = 'Ładowanie ról...';

      // Добавляем элементы в DOM
      teamEl.appendChild(teamImg);
      teamEl.appendChild(teamNameLink);
      teamEl.appendChild(roleP);

      teamsContainer.appendChild(teamEl);

      // 3) Запрашиваем роли пользователя в этой команде
      try {
        // GET /team/get-team-member-by-team-and-userId?teamId=...&userId=...
        const roleUrl = `http://localhost:8765/team/get-team-member-by-team-and-userId?teamId=${team.id}&userId=${userId}`;
        const roleResp = await fetch(roleUrl, { method: 'GET' });
        if (roleResp.ok) {
          const roleData = await roleResp.json();
          // Пример структуры roleData:
          // {
          //   "id": 1,
          //   "userId": 4,
          //   "roles": [
          //     { "id": 1, "name": "MANAGER" },
          //     { "id": 2, "name": "CAPTAIN" }
          //   ]
          // }
          if (roleData.roles && roleData.roles.length > 0) {
            const rolesText = roleData.roles.map(r => r.name).join(', ');
            roleP.textContent = rolesText;
          } else {
            roleP.textContent = 'Brak ról';
          }
        } else {
          console.warn(`Не удалось загрузить роли для teamId=${team.id}, userId=${userId}`);
          roleP.textContent = 'Brak danych o rolach';
        }
      } catch (err) {
        console.error(`Ошибка при запросе ролей teamId=${team.id}, userId=${userId}:`, err);
        roleP.textContent = 'Błąd wczytywania ról';
      }
    }
  } catch (err) {
    console.error('Ошибка при загрузке публичных команд:', err);
  }
}

/**
 * Если нужно удалять searchedProfile при клике на ссылки <a>, можете добавить:
 *
 * document.querySelectorAll('a').forEach(link => {
 *   link.addEventListener('click', () => {
 *     localStorage.removeItem('searchedProfile');
 *   });
 * });
 */

/**
 * Функция выхода из системы (если нужна)
 */
function logOut() {
  localStorage.clear();
  window.location.href = 'main.html';
}
