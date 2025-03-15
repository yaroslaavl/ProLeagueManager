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
      let isCapitan = member.roles.some(role => role.name === 'CAPITAN');

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
          <img src=${playerImg} alt="Avatar" class="player-avatar">
          <div class="player-info">
            <p class="player-name" style="color: #3861FB">${playerInfo.firstName + " " + playerInfo.lastName}</p>
            <a href="public-profile.html"><p class="player-nickname">${playerInfo.username}</p></a>
            <p class="player-joined">${new Date(member.joinedAt).toLocaleDateString()}</p>
            <p class="player-roles">${rolesText}</p>
          </div>
        </div>`;
        document.getElementById('manager_name').innerText = `${playerInfo.username}`;
      }
      else if(isCapitan === true){
        document.getElementById('players').innerHTML += `
        <div class="player">
          <img src=${playerImg} alt="Avatar" class="player-avatar">
          <div class="player-info">
            <p class="player-name" style="color: darkgoldenrod">${playerInfo.firstName + " " + playerInfo.lastName}</p>
            <a href="public-profile.html"><p class="player-nickname">${playerInfo.username}</p></a>
            <p class="player-joined">${new Date(member.joinedAt).toLocaleDateString()}</p>
            <p class="player-roles">${rolesText}</p>
          </div>
        </div>`;}
      else{
        document.getElementById('players').innerHTML += `
        <div class="player">
          <img src=${playerImg} alt="Avatar" class="player-avatar">
          <div class="player-info">
            <p class="player-name">${playerInfo.firstName + " " + playerInfo.lastName}</p>
            <a href="public-profile.html"><p class="player-nickname">${playerInfo.username}</p></a>
            <p class="player-joined">${new Date(member.joinedAt).toLocaleDateString()}</p>
            <p class="player-roles">${rolesText}</p>
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
      const response = await fetch(`http://localhost:8765/team/team-leave/${teamName}`,{
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
    const response = await fetch(`http://localhost:8765/team/team-invite/${teamInfo.id}/${targetId}`,{
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
