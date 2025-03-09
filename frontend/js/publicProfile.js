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
}else{
  getUserData();
}
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

    if (!data || data.length === 0) {
      console.error("No teams found for this user.");
      const teams = document.getElementById('teams');
      teams.innerHTML = '<p style="color: #808A9D;">Nie nalezy do zadnego zespolu</p>';
      teams.style.backgroundColor= '#EFF2F5';
      teams.style.display = 'block';
      teams.style.justifyContent = 'center';
      return;
    }

    console.log(data);

    // Установить имя команды
    document.getElementById('team_name').innerText = data[0].teamName;

    try {
      const logoUrl = `http://localhost:8765/team/team-logo/${data[0].teamName}`;
      const logoResponse = await fetch(logoUrl);

      if (!logoResponse.ok) {
        console.error("Failed to fetch team logo");
        return;
      }

      // Установить URL логотипа
      document.getElementById('Team_avatar').src = logoUrl;
    } catch (err) {
      console.error("Error while receiving team logo");
    }
    try {
      const roleUrl = `http://localhost:8765/team/get-team-member-by-team-and-userId?teamId=${data[0].id}&userId=${userId}`;
      const roleResponse = await fetch(roleUrl);

      if (!roleResponse.ok) {
        console.error("Failed to fetch team role");
        return;
      }

      // Парсинг JSON-ответа
      const roleData = await roleResponse.json();

      // Логирование ответа
      console.log("Role data:", roleData);
      let role = roleData.roles;
      console.log(role[0].name,role[1].name,role[2].name)
      document.getElementById('roles').innerText = `${role[2].name},${role[1].name},${role[0].name}`;
      // Проверяем наличие данных
      if (!roleData || Object.keys(roleData).length === 0) {
        console.error("No role data found");
        return;
      }

      // Выполните дальнейшие действия с roleData
    } catch (err) {
      console.error("Error while fetching team role:", err);
    }

  } catch (err) {
    console.error(`Error while receiving data from server`);
  }
}

document.getElementById('team_name').addEventListener('click',()=>{
  localStorage.setItem('MyTeam',document.getElementById('team_name').innerText);
})
