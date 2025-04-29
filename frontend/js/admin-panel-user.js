if(localStorage.getItem('accToken') !== null && localStorage.getItem('refToken')!== null){
  refreshToken();
}
document.addEventListener("DOMContentLoaded", () => {
  const pageLoadSpan = document.querySelector(".footer-content span:nth-child(3)");
  const htmlLoadSpan = document.querySelector(".footer-content span:nth-child(4)");

  if (pageLoadSpan && htmlLoadSpan) {

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
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
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

const token = localStorage.getItem('accToken');
if (!token) {
  console.warn('Нет access-token в localStorage — пользователь не авторизован.');

}



document.addEventListener('DOMContentLoaded', () => {

  const poleWyszukiwania = document.querySelector('.user-search-input');
  const kontenerWynikow  = document.querySelector('.search-result');
  const token            = localStorage.getItem('accToken');

  if (!token) {
    console.warn('Brak accToken w localStorage — funkcje wyszukiwania i usuwania nieaktywne.');
    return;
  }


  poleWyszukiwania.addEventListener('input', () => {
    const fraza = poleWyszukiwania.value.trim();
    if (!fraza) {
      kontenerWynikow.innerHTML = '';
      return;
    }
    pobierzUzytkownikow(fraza);
  });


  async function pobierzUzytkownikow(fraza) {
    try {
      const odpowiedz = await fetch(
        `http://localhost:8765/user/search-user?keyword=${encodeURIComponent(fraza)}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!odpowiedz.ok) throw new Error(`Błąd wyszukiwania: ${odpowiedz.status}`);
      const uzytkownicy = await odpowiedz.json();
      pokazUzytkownikow(uzytkownicy);
    } catch (err) {
      console.error('Błąd podczas pobierania użytkowników:', err);
    }
  }


  function pokazUzytkownikow(uzytkownicy) {
    kontenerWynikow.innerHTML = '';

    uzytkownicy.forEach(u => {
      const player = document.createElement('div');
      player.classList.add('player');
      player.dataset.userId = u.id;


      const avatar = document.createElement('img');
      avatar.classList.add('player-avatar');
      avatar.src = 'http://localhost:9000/user-image-bucket/avatars/default-user.png';
      avatar.alt = u.username;

      avatar.onerror = null;

      const nazwa = document.createElement('p');
      nazwa.classList.add('username');
      nazwa.textContent = u.username;


      const usun = document.createElement('img');
      usun.classList.add('delete-player');
      usun.src = 'img/trash.svg';
      usun.alt = 'Usuń';
      usun.style.cssText = 'margin-left:auto;cursor:pointer;width:30px';
      usun.addEventListener('click', () => usunUzytkownika(u.id, player));

      player.append(avatar, nazwa, usun);
      kontenerWynikow.append(player);


      fetchUserAvatar(u.username)
        .then(urlImg => {
          avatar.src = urlImg;
        })
        .catch(err => {
          console.warn(`Nie udało się pobrać awatara ${u.username}:`, err);
        });
    });
  }


  async function fetchUserAvatar(username) {
    try {
      const res = await fetch(
        `http://localhost:8765/user/avatar/${encodeURIComponent(username)}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('accToken')}` } }
      );
      if (!res.ok) throw new Error(`Avatar request failed: ${res.status}`);
      const urlImg = await res.text();
      return urlImg.startsWith('http') ? urlImg
        : 'http://localhost:9000/user-image-bucket/avatars/default-user.png';
    } catch (err) {
      console.warn('Błąd przy pobieraniu awatara:', err);
      return 'http://localhost:9000/user-image-bucket/avatars/default-user.png';
    }
  }


  async function usunUzytkownika(id, element) {
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;
    try {
      const odpowiedz = await fetch(
        `http://localhost:8765/user/admin-deletion/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!odpowiedz.ok) throw new Error(`Błąd usuwania: ${odpowiedz.status}`);
      element.remove();
      window.location.href = "admin-panel-user.html";
    } catch (err) {
      console.error('Błąd podczas usuwania użytkownika:', err);
      alert('Błąd podczas usuwania użytkownika');
    }
  }
});
document.addEventListener('DOMContentLoaded', () => {

  document.addEventListener('click', () => {
    document.querySelectorAll('.role-dropdown').forEach(d => d.remove());
  });


  const roleInput   = document.querySelector('.role-search-input');
  const roleResults = document.querySelector('.role-search-result');

  roleInput.addEventListener('input', () => {
    const q = roleInput.value.trim();
    roleResults.innerHTML = '';
    if (!q) return;

    fetch(
      `http://localhost:8765/user/search-user?keyword=${encodeURIComponent(q)}`,
      { headers: { 'Authorization': `Bearer ${localStorage.getItem('accToken')}` } }
    )
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(users => renderRoleCards(users))
      .catch(err => console.error('Błąd wyszukiwania do ról:', err));
  });


  function renderRoleCards(users) {
    roleResults.innerHTML = '';
    users.forEach(u => {
      const card = document.createElement('div');
      card.classList.add('player');
      card.dataset.userId = u.id;
      card.style.position = 'relative';

      card.innerHTML = `
        <img class="player-avatar"
             src="http://localhost:9000/user-image-bucket/avatars/default-user.png"
             onerror="this.src='http://localhost:9000/user-image-bucket/avatars/default-user.png'">
        <p class="username">${u.username}</p>
        <img src="img/style=linear.svg"
             class="role-toggle"
             alt="▼"
             title="Zmień role"
             style="margin-left:auto; cursor:pointer; width:20px;">
      `;


      card.querySelector('.role-toggle').addEventListener('click', e => {
        e.stopPropagation();
        toggleRoleMenu(card);
      });

      roleResults.append(card);
    });
  }


  function toggleRoleMenu(card) {

    const existing = card.querySelector('.role-dropdown');
    if (existing) {
      existing.remove();
      return;
    }


    document.querySelectorAll('.role-dropdown').forEach(d => d.remove());

    const menu = document.createElement('div');
    menu.classList.add('role-dropdown');


    menu.addEventListener('click', e => e.stopPropagation());


    const roles = ['SYSTEM_ADMIN','CONTENT_TEAM','VERIFIED_USER','USER'];
    roles.forEach(r => {
      const lbl = document.createElement('label');
      lbl.style.display = 'block';
      lbl.innerHTML = `<input type="checkbox" value="${r}"> ${r}`;
      menu.append(lbl);
    });


    const btn = document.createElement('button');
    btn.textContent = 'Zapisz';
    btn.classList.add('btn-confirm-roles');
    btn.style.marginTop = '10px';
    btn.addEventListener('click', async () => {
      const checked = Array.from(menu.querySelectorAll('input:checked'))
        .map(i => i.value);
      if (checked.length === 0) {
        alert('Wybierz przynajmniej jedną rolę.');
        return;
      }
      try {
        const query = checked.map(encodeURIComponent).join(',');
        const userId = card.dataset.userId;
        const res = await fetch(
          `http://localhost:8765/user/change-user-role/${userId}?role=${query}`,
          {method:'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('accToken')}` } }
        );
        if (!res.ok) throw new Error(res.status);
        alert('Role zostały zaktualizowane.');
        menu.remove();
        window.location.href = "admin-panel-user.html";
      } catch (err) {
        console.error('Błąd zapisu ról:', err);
        alert('Nie udało się zapisać ról.');
      }
    });
    menu.append(btn);

    card.append(menu);
  }
});

