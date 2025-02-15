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

async function getData(){
  try {
    if(localStorage.getItem('MyTeam') === null && localStorage.getItem('SearchResult') === null) throw new Error('No result by search or redirecting');
    let Team = localStorage.getItem('MyTeam')
    if(Team === null) Team = localStorage.getItem('SearchResult');

    const res = await fetch(`http://localhost:8765/team/currentTeam/${Team}`);
    const receivedData = await res.json();

    let teamInfo = receivedData.team;
    let members = receivedData.members;

    console.log(teamInfo);
    console.log(members);

    document.getElementById('team_name').innerText = `${teamInfo.teamName}`;
    document.getElementById('createdAt').innerText = `${new Date(teamInfo.createdAt).toLocaleDateString()}`
    let teamimg = await fetch(`http://localhost:8765/team/team-logo/${Team}`);
    document.getElementById('team_img').src = teamimg.url;


    members.forEach(member => {
      // Формируем строку с ролями
      let rolesText = member.roles.map(role => role.name).join(', ');

      // Проверяем, есть ли среди ролей "MANAGER"
      let isManager = member.roles.some(role => role.name === 'MANAGER');
      let isCapitan = member.roles.some(role => role.name === 'CAPITAN');
      isManager ? document.getElementById('manager_name').innerText = `${member.userId}` : '';
      if(isManager === true){
        document.getElementById('players').innerHTML += `
        <div class="player">
          <img src="img/profile.svg" alt="Avatar" class="player-avatar">
          <div class="player-info">
            <p class="player-name" style="color: #3861FB">Zhan Karpovich</p>
            <p class="player-nickname">zhan_karp</p>
            <p class="player-joined">${new Date(member.joinedAt).toLocaleDateString()}</p>
            <p class="player-roles">${rolesText}</p>
          </div>
        </div>`;}
      else if(isCapitan === true){
        document.getElementById('players').innerHTML += `
        <div class="player">
          <img src="img/profile.svg" alt="Avatar" class="player-avatar">
          <div class="player-info">
            <p class="player-name" style="color: darkgoldenrod">Zhan Karpovich</p>
            <p class="player-nickname">zhan_karp</p>
            <p class="player-joined">${new Date(member.joinedAt).toLocaleDateString()}</p>
            <p class="player-roles">${rolesText}</p>
          </div>
        </div>`;}
      else{
        document.getElementById('players').innerHTML += `
        <div class="player">
          <img src="img/profile.svg" alt="Avatar" class="player-avatar">
          <div class="player-info">
            <p class="player-name">Zhan Karpovich</p>
            <p class="player-nickname">zhan_karp</p>
            <p class="player-joined">${new Date(member.joinedAt).toLocaleDateString()}</p>
            <p class="player-roles">${rolesText}</p>
          </div>
        </div>`;}
      })





  }catch (err){
    console.error(err);
  }
}
getData();
