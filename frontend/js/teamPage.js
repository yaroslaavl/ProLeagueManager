refreshToken();
document.addEventListener("DOMContentLoaded", () => {
  const pageLoadSpan = document.querySelector(".footer-content span:nth-child(3)");
  const htmlLoadSpan = document.querySelector(".footer-content span:nth-child(4)");

  if (pageLoadSpan && htmlLoadSpan) {
    // Ждём окончания полной загрузки страницы
    window.addEventListener("load", () => {
      setTimeout(() => {
        const performanceTiming = performance.timing;

        // Время полной загрузки страницы
        const pageLoadTime = performanceTiming.loadEventEnd - performanceTiming.navigationStart;

        // Время загрузки HTML
        const htmlLoadTime = performanceTiming.responseEnd - performanceTiming.responseStart;

        // Проверяем, что значения корректны
        const validPageLoadTime = pageLoadTime > 0 ? pageLoadTime : performance.now(); // Используем performance.now() как fallback
        const validHtmlLoadTime = htmlLoadTime > 0 ? htmlLoadTime : 0;

        // Обновляем значения в DOM с обёрткой для стилей
        pageLoadSpan.innerHTML = `Strona: <span class="blue">${Math.round(validPageLoadTime)}ms</span>`;
        htmlLoadSpan.innerHTML = `Szablon: <span class="blue">${Math.round(validHtmlLoadTime)}ms</span>`;

        // Логируем значения для отладки
        console.log("Page Load Time (ms):", validPageLoadTime);
        console.log("HTML Load Time (ms):", validHtmlLoadTime);
      }, 0);
    });
  }
});
let accToken = localStorage.getItem("accToken");
let refToken = localStorage.getItem("refToken");
if(accToken === null || refToken === null){
  var notifBtn = document.getElementById("notification_button");
  var burgerAndUser = document.getElementById("header_right");
  while (burgerAndUser.firstChild) {
    burgerAndUser.removeChild(burgerAndUser.firstChild);
  }
  while (notifBtn.firstChild) {
    notifBtn.removeChild(notifBtn.firstChild);
  }
  burgerAndUser.innerHTML = `
  <a href="login.html" class="registerBtn" style="width: 100%;height: 100%;cursor: pointer"><button class="register">Zaloguj sie</button></a>
  `
  burgerAndUser.style.backgroundColor = "white"

}
async function refreshToken(){
  try {
    const url = "http://localhost:8765/auth/refresh-token";
    const refToken = localStorage.getItem("refToken");
    const response = await fetch(url,{
      method:"POST",
      headers:{
        "Authorization": `Bearer ${refToken}`,
        "Content-Type": "application/json"
      }
    })
    if(!response.ok)throw new Error("Error Refresh Token");
    const Tokens = await response.json();
    localStorage.setItem("accToken",Tokens.accessToken);
    localStorage.setItem("refToken",Tokens.refreshToken);
  }catch (err){
    console.error(err);
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
if (document.getElementById('log-out') !== null){
  const logOutBtn = document.getElementById('log-out').addEventListener('click',logOut);
}
let teamInfo;
async function getData(){
  try {
    if(localStorage.getItem('MyTeam') === null && localStorage.getItem('SearchResult') === null) throw new Error('No result by search or redirecting');
    let Team = localStorage.getItem('MyTeam')
    if(Team === null) Team = localStorage.getItem('SearchResult');

    const res = await fetch(`http://localhost:8765/team/currentTeam/${Team}`);
    const receivedData = await res.json();

    teamInfo = receivedData.team;
    let members = receivedData.members;

    console.log(teamInfo);
    console.log(members);

    document.getElementById('team_name').innerText = `${teamInfo.teamName}`;
    document.getElementById('createdAt').innerText = `${new Date(teamInfo.createdAt).toLocaleDateString()}`
    let teamimg = await fetch(`http://localhost:8765/team/team-logo/${teamInfo.id}`);
    document.getElementById('team_img').src = await teamimg.text();


    for (const member of members) {
      // Формируем строку с ролями
      let rolesText = member.roles.map(role => role.name).join(', ');
      let playerInfo;
      let playerImg;
      // Проверяем, есть ли среди ролей "MANAGER"
      let isManager = member.roles.some(role => role.name === 'MANAGER');
      let isCapitan = member.roles.some(role => role.name === 'CAPTAIN');

      try {
        const userId = member.userId;
        const response =  await fetch(`http://localhost:8765/user/getUser/${userId}`);
        playerInfo = await response.json();

      }catch (err) {console.log(err);}
      try {
        const response = await fetch(`http://localhost:8765/user/avatar/${playerInfo.username}`);
        playerImg = await response.text();
      }catch (err){console.log(err);}
      if(isManager === true){
        document.getElementById('players').innerHTML += `
        <div class="player">
          <div class="player-info">
          <img src=${playerImg} alt="Avatar" class="player-avatar">
            <p class="player-name" style="color: #3861FB">${playerInfo.firstName + " " + playerInfo.lastName}</p>
            <a href="public-profile.html"><p class="player-nickname">${playerInfo.username}</p></a>
            <p class="player-joined">${new Date(member.joinedAt).toLocaleDateString()}</p>

          </div>
        </div>`;
        document.getElementById('manager_name').innerText = `${playerInfo.username}`;
      }
      else if(isCapitan === true){
        document.getElementById('players').innerHTML += `
        <div class="player">

          <div class="player-info">
            <img src=${playerImg} alt="Avatar" class="player-avatar">
            <p class="player-name" style="color: darkgoldenrod">${playerInfo.firstName + " " + playerInfo.lastName}</p>
            <a href="public-profile.html"><p class="player-nickname">${playerInfo.username}</p></a>
            <p class="player-joined">${new Date(member.joinedAt).toLocaleDateString()}</p>

          </div>
        </div>`;}
      else{
        document.getElementById('players').innerHTML += `
        <div class="player">

          <div class="player-info">
          <img src=${playerImg} alt="Avatar" class="player-avatar">
            <p class="player-name">${playerInfo.firstName + " " + playerInfo.lastName}</p>
            <a href="public-profile.html"><p class="player-nickname">${playerInfo.username}</p></a>
            <p class="player-joined">${new Date(member.joinedAt).toLocaleDateString()}</p>

          </div>
        </div>`;}
      }


  }catch (err){
    console.error(err);
  }
}
getData();
document.addEventListener("DOMContentLoaded", function () {
  const confirmButton = document.getElementById("leave_btn");
  if (confirmButton) {
    confirmButton.addEventListener("click", function () {
      openConfirmationDialog();
    });
  } else {
    console.error("Кнопка подтверждения не найдена в DOM");
  }
});
function openConfirmationDialog() {
  // Затемненный фон
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

  // Диалоговое окно
  const dialog = document.createElement("div");
  dialog.style.background = "#fff";
  dialog.style.padding = "20px";
  dialog.style.borderRadius = "8px";
  dialog.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  dialog.style.minWidth = "300px";
  dialog.style.textAlign = "center";

  // Заголовок
  const title = document.createElement("h2");
  title.textContent = "Czy napewno chcesz kontynuowac?";
  const paragraph = document.createElement("p");
  paragraph.innerHTML = " - Opuścisz drużynę i nie będziesz już mógł uczestniczyć w przyszłych turniejach ani meczach. <br> - Jeśli jesteś menadżerem drużyny, Twoja rola zostanie przeniesiona na kapitana lub starszego gracza. <br> - Jeśli jesteś jedynym graczem w drużynie, Twoja drużyna zostanie usunięta z listy zespolow!"
  paragraph.style.color = "#808A9D";
  paragraph.style.textAlign = 'left';
  paragraph.style.fontStyle = "bold";
  paragraph.style.fontSize = "12px";
  // Кнопки
  const buttonContainer = document.createElement("div");
  buttonContainer.style.marginTop = "15px";

  const yesButton = document.createElement("button");
  yesButton.textContent = "Tak";
  yesButton.style.padding = "8px 16px";
  yesButton.style.marginRight = "10px";
  yesButton.style.border = "none";
  yesButton.style.backgroundColor = "#28a745";
  yesButton.style.color = "white";
  yesButton.style.borderRadius = "4px";
  yesButton.style.cursor = "pointer";

  const noButton = document.createElement("button");
  noButton.textContent = "Nie";
  noButton.style.padding = "8px 16px";
  noButton.style.border = "none";
  noButton.style.backgroundColor = "#dc3545";
  noButton.style.color = "white";
  noButton.style.borderRadius = "4px";
  noButton.style.cursor = "pointer";

  yesButton.addEventListener("click", async function () {
    const teamName = document.getElementById('team_name').textContent;
    console.log(teamName);
    try {
      const response = await fetch(`http://localhost:8765/team/leave/${teamName}`,{
        method:"PUT",
        headers:{
          "Authorization": `Bearer ${localStorage.getItem('accToken')}`,
          "Content-type": "application/json",
        }
      });

      setTimeout(function(){
        location.href = 'main.html';
      }, 2000);
    } catch (err) {
      console.error("Error while leaving from team");
    }

    document.body.removeChild(overlay);
  });

  noButton.addEventListener("click", function () {
    document.body.removeChild(overlay);
  });

  buttonContainer.appendChild(yesButton);
  buttonContainer.appendChild(noButton);

  dialog.appendChild(title);
  dialog.appendChild(paragraph)
  dialog.appendChild(buttonContainer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}
document.getElementById('usernameInput').addEventListener('input', async function () {

  try {
    let wordInput = document.getElementById('usernameInput').value;
    const response = await fetch(`http://localhost:8765/user/search-user?keyword=${wordInput}`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const users = await response.json();
    displayUsers(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    clearSearch();
  }
});
async function displayUsers(users) {
  const usersContainer = document.querySelector('.users_found');
  usersContainer.innerHTML = ''; // Очищаем предыдущие результаты
  for (const user of users) {
    const userElement = document.createElement('div');
    userElement.classList.add('user');
    let userAvatar;
    try {
      const response = await fetch(`http://localhost:8765/user/avatar/${user.username}`)
      userAvatar = await response.text()
    } catch (err){
      console.error(`Error while receiveing player avatar ${err}`);
    }
    if (user.username === document.getElementById('manager_name').textContent) {
      userElement.innerHTML = `
            <div class="avata_and_info">
                <img src="${userAvatar}" alt="Avatar">
                <div class="user_info">
                    <p>${user.username}</p>
                    <p>${user.email}</p>
                </div>
            </div>
        `;
    }else{
      userElement.innerHTML = `
            <div class="avata_and_info">
                <img src="${userAvatar}" alt="Avatar">
                <div class="user_info">
                    <p>${user.username}</p>
                    <p>${user.email}</p>
                </div>
            </div>
            <button onclick="inviteUser('${user.id}')"><img class="invite-btn" src="https://www.svgrepo.com/show/513862/user-add.svg" alt=""></button>
        `;
    }


    usersContainer.appendChild(userElement);
  }
}
async function inviteUser(targetId) {
  try {
    const response = await fetch(`http://localhost:8765/team/invite/${teamInfo.id}/${targetId}`,{
      method: 'POST',
      headers:{
        "Authorization": `Bearer ${localStorage.getItem('accToken')}`,
        "Content-type": "application/json",
      }
    });
    console.log(`Server response:`,response.status);
    alert("Zaproszenie bylo odeslane!");
    clearSearch();
  } catch (err) {
    console.error(`Error while sending the invantation: ${err}`);
  }
}
function clearSearch() {
  document.getElementById('usernameInput').value = '';
  document.querySelector('.users_found').innerHTML = '';
}
async function getTeamNotifications() {
  try {
    let Team = localStorage.getItem('MyTeam');
    if (!Team) Team = localStorage.getItem('SearchResult');

    // Получаем ID текущей команды
    const res = await fetch(`http://localhost:8765/team/currentTeam/${Team}`);
    const receivedData = await res.json();
    const teamId = receivedData.team.id;

    // Запрос на получение уведомлений команды
    const url = `http://localhost:8765/my-notifications/get-team/${teamId}`;
    const params = {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('accToken')}`,
        "Content-type": "application/json",
      }
    };

    const response = await fetch(url, params);
    if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

    const notifications = await response.json();
    console.log("📜 Уведомления команды:", notifications);

    // Вызываем функцию отображения уведомлений
    displayTeamNotifications(notifications);
  } catch (err) {
    console.error("❌ Ошибка получения уведомлений команды:", err);
  }
}
// 🔹 Функция отображения уведомлений
function displayTeamNotifications(notifications) {
  const notificationsContainer = document.querySelector(".notifications-container");

  // Очищаем контейнер перед добавлением новых уведомлений
  notificationsContainer.innerHTML = "";

  if (!notifications.length) {
    notificationsContainer.innerHTML = `<p class="no-notifications">Brak powiadomień.</p>`;
    return;
  }

  notifications.forEach(notification => {
    const notificationItem = document.createElement("div");
    notificationItem.classList.add("manager-notification-item");

    let message = notification.message;

    // Проверяем тип уведомления
    if (notification.eventType === "PLAYER_INVITED" || notification.eventType === "PLAYER_DECLINED") {
      message = `${notification.message}`;
    }

    notificationItem.innerHTML = `
            <p class="manager-notification-message">${message}</p>
            <span class="manager-notification-time">${new Date(notification.createdAt).toLocaleDateString()}</span>
        `;

    notificationsContainer.appendChild(notificationItem);
  });
}
// 🔹 Функция извлечения названия команды
function extractTeamName(notificationMessage) {
  const match = notificationMessage.match(/team:\s(.+)/);
  return match ? match[1] : null;
}
// Загружаем уведомления при загрузке страницы
async function getUserTeamRole() {
  try {
    await refreshToken();
    let Team = localStorage.getItem('MyTeam') || localStorage.getItem('SearchResult');
    if (!Team) {
      console.error("❌ Ошибка: Не найдена команда в localStorage!");
      return;
    }
    const token = localStorage.getItem('accToken');
    if (!token) {
      console.error("❌ Ошибка: Токен авторизации отсутствует!");
      return;
    }
    // Запрашиваем ID команды
    const res = await fetch(`http://localhost:8765/team/currentTeam/${Team}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) {
      console.error(`❌ Ошибка при получении ID команды: ${res.status}`);
      return;
    }
    const receivedData = await res.json();
    const teamId = receivedData?.team?.id;
    if (!teamId) {
      console.error("❌ Ошибка: ID команды не найден в ответе сервера.");
      return;
    }
    // Запрос на роль пользователя
    const response = await fetch(`http://localhost:8765/team/${teamId}/user-role`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      console.error(`❌ Ошибка при получении роли пользователя: ${response.status}`);
      return;
    }
    let Role = await response.json();
    if (!Role.roles || !Array.isArray(Role.roles)) {
      console.error("❌ Ошибка: Некорректный формат данных о ролях.");
      return;
    }
    // Проверка роли менеджера
    if (Role.roles.some(role => role.name === 'MANAGER')) {
      await getTeamNotifications();

    } else {
      document.getElementById('manager-menu').innerHTML = "";
      document.getElementById('manager-options').innerHTML = "";
    }
  } catch (err) {
    console.error("❌ Ошибка выполнения getUserTeamRole:", err);
  }
}
// Вызываем функцию
getUserTeamRole();
// Добавляем после загрузки данных о пользователях функцию для рендера кнопки настроек, если роль - менеджер
async function getUserTeamRoleInfo() {
  await refreshToken();
  const res = await fetch(`http://localhost:8765/team/currentTeam/${localStorage.getItem('MyTeam')}`);
  const data = await res.json();
  const teamId = data.team.id;

  const response = await fetch(`http://localhost:8765/team/${teamId}/user-role`, {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem('accToken')}`,
      "Content-Type": "application/json"
    }
  });
  const Role = await response.json();
  return { isManager: Role.roles.some(r => r.name === 'MANAGER'), teamId };
}
// Добавляем после загрузки данных о пользователях функцию для рендера кнопки настроек, если роль - менеджер
async function addRoleEditButtons() {
  const roleCheck = await getUserTeamRoleInfo();
  if (!roleCheck.isManager) return; // Если не менеджер - не показываем кнопки

  const playerCards = document.querySelectorAll('.player');
  playerCards.forEach((card) => {
    const nicknameElement = card.querySelector('.player-nickname');
    if (!nicknameElement) return; // Пропускаем карточки без nickname

    const playerNickname = nicknameElement.textContent;

    const settingsBtn = document.createElement('button');
    settingsBtn.innerHTML = '<img src="https://www.svgrepo.com/show/447437/menu-alt3.svg" style="width: 24px; height:24px">';
    settingsBtn.style.background = 'none';
    settingsBtn.style.border = 'none';
    settingsBtn.style.cursor = 'pointer';
    settingsBtn.style.margin = "0";
    settingsBtn.addEventListener('click', () => toggleRoleEditor(card, playerNickname, roleCheck.teamId));

    card.querySelector('.player-info').appendChild(settingsBtn);
  });
}

async function toggleRoleEditor(playerCard, username, teamId) {
  let existingEditor = playerCard.querySelector('.role-editor');
  if (existingEditor) {
    existingEditor.remove();
    return;
  }

  const userInfo = await fetch(`http://localhost:8765/user/search-user?keyword=${username}`)
    .then(res => res.json());
  const userId = userInfo[0].id;

  const rolesResponse = await fetch(`http://localhost:8765/team/get-team-member-by-team-and-userId?teamId=${teamId}&userId=${userId}`);
  const memberData = await rolesResponse.json();
  const userRoles = memberData.roles.map(role => role.name);

  const editor = document.createElement('div');
  editor.classList.add('role-editor');
  editor.style = 'width: 90%; background: #F9FAFB; border-top: 1px solid #ddd; padding: 15px; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;';

  editor.innerHTML = `
    <div style="display: block; flex-direction: column; gap: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>Kapitan</span>
        <input type="checkbox" id="role-capitan-${userId}" ${userRoles.includes('CAPTAIN') ? 'checked' : ''}>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>Manager</span>
        <input type="checkbox" id="role-manager-${userId}" ${userRoles.includes('MANAGER') ? 'checked' : ''}>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>Gracz</span>
        <input type="checkbox" id="role-gracz-${userId}" ${userRoles.includes('PLAYER') ? 'checked' : ''}>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 15px;">
        <button onclick="kickPlayer('${userId}')" style="flex: 1; background: #EA3943; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold;cursor: pointer;">Wyrzucić</button>
        <button onclick="saveRoles('${userId}')" style="flex: 2; background: #3861FB; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold;cursor: pointer;">Zapisz</button>
      </div>
    </div>
  `;

  playerCard.appendChild(editor);
}

async function saveRoles(userId) {
  const teamId = teamInfo.id; // Используем уже полученный объект teamInfo для ID команды

  const currentRolesResponse = await fetch(`http://localhost:8765/team/get-team-member-by-team-and-userId?teamId=${teamId}&userId=${userId}`, {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem('accToken')}`,
      "Content-Type": "application/json"
    }
  });
  if (!currentRolesResponse.ok) {
    alert('Ошибка при получении текущих ролей. Убедитесь, что у вас есть права менеджера.');
    return;
  }

  const currentMemberData = await currentRolesResponse.json();
  const currentRoles = currentMemberData.roles.map(role => role.name);

  const newRoles = [];
  if (document.getElementById(`role-manager-${userId}`).checked) newRoles.push('MANAGER');
  if (document.getElementById(`role-capitan-${userId}`).checked) newRoles.push('CAPTAIN');
  if (document.getElementById(`role-gracz-${userId}`).checked) newRoles.push('PLAYER');

  const addedRoles = newRoles.filter(role => !currentRoles.includes(role));
  const removedRoles = currentRoles.filter(role => !newRoles.includes(role));

  await fetch(`http://localhost:8765/team/update-role/${teamId}/${userId}`, {
    method: 'PUT',
    headers: {
      "Authorization": `Bearer ${localStorage.getItem('accToken')}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      addedRoles: addedRoles.length > 0 ? addedRoles : [],
      removedRoles: removedRoles.length > 0 ? removedRoles : []
    })
  });

  alert('Role updated!');
  location.reload();
}

async function kickPlayer(userId) {
  const { teamId } = await getUserTeamRoleInfo();
  await fetch(`http://localhost:8765/team/user-deletion/${teamId}/${userId}`, {
    method: 'PUT',
    headers: {
      "Authorization": `Bearer ${localStorage.getItem('accToken')}`
    }
  });
  alert('Player removed!');
  location.reload();
}

addRoleEditButtons();

function openManagerSettings() {
  document.getElementById('managerSettingsModal').style.display = 'flex';
  document.getElementById('teamNameInput').value = document.getElementById('team_name').textContent;
  document.getElementById('currentTeamLogo').src = document.getElementById('team_img').src;
}

function closeManagerSettings() {
  document.getElementById('managerSettingsModal').style.display = 'none';
}

function previewTeamLogo() {
  const fileInput = document.getElementById('teamLogoInput');
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('currentTeamLogo').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

async function saveTeamName() {
  const newName = document.getElementById('teamNameInput').value;
  const response = await fetch(`http://localhost:8765/team/update-team-name/${teamInfo.id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ teamName: newName })
  });
  if (response.ok) {
    alert('Nazwa drużyny została zaktualizowana!');
    location.href = 'public-profile.html';
  }
}

async function saveTeamLogo() {
  const fileInput = document.getElementById('teamLogoInput');
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('teamLogo', file);
  console.log(formData);
  const response = await fetch(`http://localhost:8765/team/upload-team-logo/${teamInfo.id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accToken')}`
    },
    body: formData
  });
  if (response.ok) {
    alert('Logo drużyny zostało zaktualizowane!');
    location.href = 'public-profile.html';
  }
}

async function saveTeamStatus() {
  const status = document.getElementById('teamStatus').value;
  const response = await fetch(`http://localhost:8765/team/status/${teamInfo.id}?teamStatus=${status.toUpperCase()}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accToken')}`,
      'Content-Type': 'application/json'
    },
  });
  if (response.ok) {
    alert('Status drużyny został zaktualizowany!');
    location.href = 'public-profile.html';
  }
}





