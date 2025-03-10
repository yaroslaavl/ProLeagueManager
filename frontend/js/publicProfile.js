refreshtoken();
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
document.addEventListener("DOMContentLoaded",()=>{
  const accToken = localStorage.getItem("accToken");
  const refreshToken = localStorage.getItem("refToken");
  if(accToken === null || refreshToken === null){
    window.location.href = "main.html";
  }
})
const accToken = localStorage.getItem("accToken");
const refreshToken = localStorage.getItem("refToken");
if(accToken === null || refreshToken === null){
  window.location.href =
    "main.html";
}else{getUserData();}
async function refreshtoken(){
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
async function getUserData() {
  try {
    const url = `http://localhost:8765/user/profile`;
    const response = await fetch(url, {
      method: "GET", // Указываем метод GET
      headers: {
        "Authorization": `Bearer ${accToken}`, // Добавляем заголовок Authorization
        "Content-Type": "application/json" // Указываем формат данных
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json(); // Парсим JSON-ответ
    console.log(data); // Выводим данные в консоль или используем их дальше
    const userName = data.username;
    const firstName = data.firstName;
    const lastName = data.lastName;
    const dateOfBirth = data.birthDate.split('-');
    let createdAt = new Date(data.createdAt).toLocaleDateString();
    let userImg;
    await getTeam(data.id);
    try {

      const res = await fetch(`http://localhost:8765/user/avatar/${userName}`);
      const urlImg =await res.text();
      console.log(urlImg);
      userImg = urlImg;
    }catch (err){
      console.error('User image are not received!');
    }

  console.log(firstName + " " + lastName)
  document.getElementById('first_last_name').innerHTML = firstName + " " + lastName;
  document.getElementById("nickname").innerHTML = userName;
  document.getElementById("date_of_birth").innerHTML = dateOfBirth[2]+'.'+dateOfBirth[1]+'.'+dateOfBirth[0]
  document.getElementById("creation-date").innerHTML = createdAt;
  document.getElementById('profile_img').src = userImg;

  } catch (err) {
    console.error(`Error: ${err}`);
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
async function getTeam(userId) {
  try {
    const url = `http://localhost:8765/team/get-teams-by-userId?userId=${userId}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to fetch teams");
      return;
    }

    const data = await response.json();

    const teamsContainer = document.getElementById('teams-container');
    teamsContainer.innerHTML = ''; // Очищаем контейнер перед добавлением новых элементов

    if (!data || data.length === 0) {
      console.error("No teams found for this user.");

      return;
    }

    console.log(data);

    for (let team of data) {
      const teamElement = document.createElement("div");
      teamElement.classList.add("teams");

      const teamImage = document.createElement("img");
      teamImage.alt = "Team_avatar";

      try {
        const logoResponse = await fetch(`http://localhost:8765/team/team-logo/${team.id}`);
        if (logoResponse.ok) {
          const logoUrl = await logoResponse.text();
          teamImage.src = logoUrl;
        } else {
          teamImage.src = "img/default-team-avatar.png"; // Заглушка, если нет логотипа
        }
      } catch (err) {
        console.error("Error while receiving team logo", err);
        teamImage.src = "img/default-team-avatar.png"; // Если ошибка, используем дефолтное изображение
      }

      const teamNameLink = document.createElement("a");
      teamNameLink.href = "teamPage.html";
      teamNameLink.style.color = "#000000";
      teamNameLink.style.fontWeight = "bold";

      const teamName = document.createElement("p");
      teamName.innerText = team.teamName;
      teamNameLink.appendChild(teamName);

      teamName.addEventListener("click", () => {
        localStorage.setItem("MyTeam", team.teamName);
      });

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

      teamElement.appendChild(teamImage);
      teamElement.appendChild(teamNameLink);
      teamElement.appendChild(roleElement);

      teamsContainer.appendChild(teamElement);
    }
  } catch (err) {
    console.error(`Error while receiving data from server:`, err);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const createTeamBtn = document.getElementById("create_team_btn");
  if (createTeamBtn) {
    createTeamBtn.addEventListener("click", function () {
      openCreateTeamDialog();
    });
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
