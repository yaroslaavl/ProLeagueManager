if(localStorage.getItem('accToken') !== null && localStorage.getItem('refToken')!== null){
  refreshToken();
}
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
  <a href="login.html" ><div class="registerBtn"><button class="register">Zaloguj sie</button></div></a>
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

async function getTournamentsByFilter(){
  try{
    let active = document.getElementById('active').checked;
    let past =document.getElementById('past').checked;
    let future =document.getElementById('future').checked;
    let isIndividual =document.getElementById('isIndividual').checked;

    let isEsport;
    if(document.getElementById('sportyButton').textContent === 'Sporty'){
      isEsport = false;
    }else{isEsport = true;}
    let response = await fetch(`http://localhost:8765/competition/search-tournaments?isIndividual=${isIndividual}&status=${active? 'ACTIVE': 'UPCOMING'}&isEsport=${isEsport}`)
    let data = await response.json();
    console.log(data);
    addTournamentsToTheList(data);
  }catch(err){
    console.error(`Error while receiving tournaments ${err}`);
  }
}
async function addTournamentsToTheList(receivedData) {
  try {
    const list = document.getElementById('tournaments-list');
    list.innerHTML = '';

    for (const tournament of receivedData) {
      const [systemResponse, imageResponse] = await Promise.all([
        fetch(`http://localhost:8765/game-system/${tournament.gameSystemId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem("accToken")}` }
        }),
        fetch(`http://localhost:8765/competition/get-image/${tournament.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem("accToken")}` }
        })
      ]);

      const system = systemResponse.ok ? await systemResponse.json() : null;
      const imageUrl = imageResponse.ok ? await imageResponse.text() : 'img/google-logo.svg';

      const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("pl-PL");
      };

      const tournamentEl = document.createElement('div');
      tournamentEl.classList.add('tournament');
      tournamentEl.innerHTML = `
        <div>
          <img src="${imageUrl}" alt="Turniej" style="border-radius: 10px">
          <div class="tournament-name">
            <p class="name">${tournament.name}</p>
            <p class="status">${tournament.status}</p>
          </div>
        </div>
        <div style="gap:40px;margin-right: 20px">
          <div class="start-time">
            <p>Start:</p>
            <p class="start-date">${formatDate(tournament.startDate)}</p>
          </div>
          <div class="end-time">
            <p>Koniec:</p>
            <p class="end-date">${formatDate(tournament.endDate)}</p>
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

      list.appendChild(tournamentEl);
    }

  } catch (err) {
    console.error(`Error while adding tournaments to the list ${err}`);
  }
}



