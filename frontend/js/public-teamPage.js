/**
 * public-teamPage.js
 *
 * Логика "публичного" просмотра команды.
 * 1) Из localStorage берем "searchedTeam" (название команды).
 * 2) Запрашиваем GET /team/currentTeam/{teamName} (или аналогичный публичный эндпоинт).
 * 3) Отрисовываем логотип, название, дату создания, участников.
 * 4) Участникам берем роли, дату присоединения и т.д.
 * 5) При закрытии вкладки / переходе - стираем "searchedTeam".
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1) Проверяем searchedTeam
  const searchedTeamName = localStorage.getItem('searchedTeam');
  if (!searchedTeamName) {
    console.warn('Нет searchedTeam в localStorage!');
    window.location.href = 'main.html';
    return;
  }

  loadPublicTeamData(searchedTeamName);

  // Удаляем searchedTeam при закрытии/переходе
  window.addEventListener('beforeunload', () => {
    localStorage.removeItem('searchedTeam');
  });
});

/**
 * Запрашиваем публичные данные команды по имени:
 * GET /team/currentTeam/{teamName}
 * В ответ (судя по скрину) приходит объект:
 * {
 *   "team": {
 *       "id": 4,
 *       "teamName": "Testik",
 *       "teamLogo": "...",
 *       "createdAt": "...",
 *       ...
 *   },
 *   "members": [
 *     {
 *       "id": 1,
 *       "userId": 10,
 *       "roles": [...],
 *       "joinedAt": "...",
 *       ...
 *     },
 *     ...
 *   ]
 * }
 */
async function loadPublicTeamData(teamName) {
  try {
    const response = await fetch(`http://localhost:8765/team/currentTeam/${teamName}`, {
      method: 'GET'
    });
    if (!response.ok) {
      throw new Error(`Ошибка при получении данных команды: ${response.status}`);
    }

    const data = await response.json();
    console.log('Public Team Data:', data);

    if (!data.team) {
      throw new Error('Некорректный ответ: нет поля "team"');
    }

    // Извлекаем объект team и массив members
    const { team, members } = data;

    // Заполняем заголовок (название команды, дата создания)
    document.getElementById('team_name').textContent = team.teamName ?? '---';
    const createdAtDate = team.createdAt ? new Date(team.createdAt).toLocaleDateString() : '--.--.----';
    document.getElementById('createdAt').textContent = createdAtDate;

    // Лого команды
    try {
      // Можно получить logo через /team/team-logo/{team.id}, либо team.teamLogo, если оно есть
      const logoResp = await fetch(`http://localhost:8765/team/team-logo/${team.id}`);
      if (logoResp.ok) {
        const logoUrl = await logoResp.text();
        document.getElementById('team_img').src = logoUrl;
      }
    } catch (err) {
      console.warn('Не удалось загрузить логотип команды:', err);
    }

    // Ищем менеджера (MANAGER), чтобы вставить в manager_name
    // Либо берем первого участника, у кого есть роль MANAGER
    const managerMember = members.find(m => m.roles.some(r => r.name === 'MANAGER'));
    if (managerMember) {
      // Получаем username (чтобы показать в manager_name)
      // Для этого запрашиваем user, но только если хотите реально показать ник
      const managerUser = await fetchUserData(managerMember.userId);
      if (managerUser) {
        document.getElementById('manager_name').textContent = managerUser.username;
      } else {
        document.getElementById('manager_name').textContent = 'Menadżer';
      }
    } else {
      // Если нет менеджера
      document.getElementById('manager_name').textContent = 'Brak Menadżera';
    }

    // Отрисовываем членов команды
    loadPublicTeamMembers(members);

  } catch (err) {
    console.error('Ошибка при загрузке публичной команды:', err);
    // redirect or show error
    // window.location.href = 'main.html';
  }
}

/**
 * Функция для загрузки и отрисовки списка участников:
 * Для каждого member:
 *  - получаем userInfo (GET /user/getUser/{userId} или публичный)
 *  - аватар (GET /user/avatar/{username})
 *  - отображаем в #players
 */
async function loadPublicTeamMembers(members) {
  try {
    const playersContainer = document.getElementById('players');

    // Очищаем, кроме шапки (которая уже есть)
    // Можно просто найти все .player:not(:first-child) и удалить их
    const allPlayers = playersContainer.querySelectorAll('.player');
    // Первый .player - шапка, оставляем
    allPlayers.forEach((player, index) => {
      if (index !== 0) player.remove();
    });

    for (const member of members) {
      // Вычислим rolesText
      const rolesText = member.roles.map(r => r.name).join(', ');
      // Запрашиваем userInfo
      const userInfo = await fetchUserData(member.userId);
      if (!userInfo) {
        console.warn(`Не удалось получить данные пользователя userId=${member.userId}`);
        continue;
      }
      // Запрашиваем аватар
      let avatarUrl = 'img/profile.svg'; // по умолчанию
      try {
        const avatarResp = await fetch(`http://localhost:8765/user/avatar/${userInfo.username}`);
        if (avatarResp.ok) {
          avatarUrl = await avatarResp.text();
        }
      } catch (err) {
        console.warn('Ошибка загрузки аватара пользователя:', err);
      }

      // Создаём блок .player
      const playerEl = document.createElement('div');
      playerEl.classList.add('player');

      const playerInfoEl = document.createElement('div');
      playerInfoEl.classList.add('player-info');
      // Пример flex-логики: justify-content: space-between
      // Но учтите, что в CSS у .player-info есть width:93% и т. п.

      // Заполняем HTML
      playerInfoEl.innerHTML = `
        <img src="${avatarUrl}" alt="Avatar" class="player-avatar">
        <p class="player-name">${userInfo.firstName ?? ''} ${userInfo.lastName ?? ''}</p>
        <!-- При клике на ник - переходим к публичному профилю пользователя -->
        <a href="open-profile.html" onclick="localStorage.setItem('searchedProfile', '${userInfo.username}')">
          <p class="player-nickname">${userInfo.username}</p>
        </a>
        <p class="player-joined">${new Date(member.joinedAt).toLocaleDateString()}</p>
      `;
      playerEl.appendChild(playerInfoEl);

      // Добавляем в список
      playersContainer.appendChild(playerEl);
    }
  } catch (err) {
    console.error('Ошибка при отрисовке членов команды:', err);
  }
}

/**
 * Вспомогательная функция, чтобы получить userInfo (username, firstName и т.д.)
 * по userId. Можно использовать /user/getUser/{userId}, если это публично доступно.
 */
async function fetchUserData(userId) {
  try {
    const resp = await fetch(`http://localhost:8765/user/getUser/${userId}`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch (err) {
    console.error(`fetchUserData error userId=${userId}`, err);
    return null;
  }
}

/**
 * Пример логаута (если нужно)
 */
function logOut() {
  localStorage.clear();
  window.location.href = 'main.html';
}
