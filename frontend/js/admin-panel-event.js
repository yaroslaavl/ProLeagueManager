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
// js/admin-panel-event.js

(() => {
  const API = 'http://localhost:8765';

  // auth headers helper
  function hdr(contentType = 'application/json') {
    const t = localStorage.getItem('accToken');
    const h = t ? { 'Authorization': `Bearer ${t}` } : {};
    if (contentType) h['Content-Type'] = contentType;
    return h;
  }

  // DOM caches
  const createForm    = document.querySelector('.create-event');
  const uploadListDom = document.querySelector('.upload-event-img .all-pins');
  const deleteListDom = document.querySelector('.delete-event   .all-pins');
  const btnCreate     = createForm.querySelector('button.create-sport');

  // inputs in create form
  const inputs = createForm.querySelectorAll('input.input-data-event');
  // order: [ title, ttl, timeUnit, matchId, competitionId ]

  function getCheckedValue(container, selector) {
    const cb = container.querySelector(`${selector}:checked`);
    return cb ? cb.value : null;
  }

  // ===== Create new pinned event =====
  async function createPinned() {

    const [ titleIn, ttlIn, unitIn, matchIn, compIn ] = inputs;
    const title = titleIn.value.trim();
    const ttl   = ttlIn.value.trim() || 1;
    const unit  = unitIn.value.trim() || 'DAYS';
    const matchId = matchIn.value.trim() || null;
    const competitionId = compIn.value.trim() || null;
    const eventType  = getCheckedValue(createForm, 'input[type="checkbox"][value="GLOBAL"],\
                                                      input[type="checkbox"][value="LEAGUE"],\
                                                      input[type="checkbox"][value="TOURNAMENT"],\
                                                      input[type="checkbox"][value="MATCH"]');
    const category   = getCheckedValue(createForm, 'input[type="checkbox"][value="GLOBAL"],\
                                                      input[type="checkbox"][value="SPORT"],\
                                                      input[type="checkbox"][value="ESPORT"]');

    if (!title || !ttl || !unit || !eventType || !category) {
      alert('Wypełnij wszystkie wymagane pola i wybierz typ oraz kategorię.');
      return;
    }

    try {
      console.log(title, matchId, competitionId, eventType, category)
      const res = await fetch(
        `${API}/event/pinned?ttl=${encodeURIComponent(ttl)}&timeUnit=${encodeURIComponent(unit)}`,
        {
          method: 'POST',
          headers: hdr(),
          body: JSON.stringify({ "title": title, "matchId": matchId, "competitionId": competitionId, "eventType": eventType, "category": category })
        }
      );
      if (!res.ok) throw new Error(res.status);
      alert('Pin utworzony');
      titleIn.value = ''; ttlIn.value = ''; unitIn.value = ''; matchIn.value = ''; compIn.value = '';
      fetchAndRenderAll();
    } catch (err) {
      console.error('Create pinned failed:', err);
      alert('Nie udało się stworzyć pinu');
    }
  }

  // ===== Fetch all pinned events =====
  async function fetchPins() {
    const res = await fetch(`${API}/event/pinned`, { headers: hdr() });
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  }

  // ===== Render upload list =====
  function renderUploadList(pins) {
    uploadListDom.innerHTML = '';
    pins.forEach(pin => {
      const div = document.createElement('div');
      div.className = 'pin';
      div.innerHTML = `
        <img src="${pin.eventImage || 'img/blogo 2.png'}" alt="" />
        <p>${pin.title}</p>
        <img src="img/style=linear.svg" class="upload-btn" title="Upload Image" style="cursor:pointer;transform:rotate(90deg);width:20px;height:20px;" />
      `;
      const btn = div.querySelector('.upload-btn');
      btn.onclick = () => uploadImageFor(pin.id);
      uploadListDom.appendChild(div);
    });
  }

  // ===== Render delete list =====
  function renderDeleteList(pins) {
    deleteListDom.innerHTML = '';
    pins.forEach(pin => {
      const div = document.createElement('div');
      div.className = 'pin';
      div.innerHTML = `
        <img src="${pin.eventImage || 'img/blogo 2.png'}" alt="" />
        <p>${pin.title}</p>
        <img src="img/trash.svg" class="delete-btn" title="Usuń Pin" style="cursor:pointer;width:20px;height:20px;" />
      `;
      const btn = div.querySelector('.delete-btn');
      btn.onclick = () => deletePinned(pin.id);
      deleteListDom.appendChild(div);
    });
  }

  // ===== Upload image for one pin =====
  function uploadImageFor(pinId) {
    // создаём <input type="file">
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async () => {
      if (!input.files.length) return;
      const file = input.files[0];

      // сразу показать превью (если нужно — ищем <img> в .pin и меняем src)
      const pinDiv = document.querySelector(`.upload-event-img .pin[data-id="${pinId}"]`);
      if (pinDiv) {
        const imgEl = pinDiv.querySelector('img');
        const reader = new FileReader();
        reader.onload = e => imgEl.src = e.target.result;
        reader.readAsDataURL(file);
      }

      // загружаем на сервер
      try {
        const fd = new FormData();
        // ключ "eventimage" в lower-case, без заголовка Content-Type
        fd.append('eventImage', file);

        const res = await fetch(
          `${API}/event/upload-pinned-image/${pinId}`,
          {
            method: 'POST',
            headers: hdr(null), // hdr(undefined) или hdr(null) пропустит Content-Type
            body: fd
          }
        );
        if (!res.ok) throw new Error(res.status);
        alert('Obrazek załadowany');
        fetchAndRenderAll();
      } catch (err) {
        console.error('Upload failed:', err);
        alert('Nie udało się załadować obrazka');
      }
    };

    // открываем диалог выбора
    input.click();
  }

  // ===== Delete a pinned event =====
  async function deletePinned(pinId) {
    if (!confirm('Na pewno usunąć ten pin?')) return;
    try {
      const res = await fetch(`${API}/event/pinned/${pinId}`, { method: 'DELETE', headers: hdr() });
      if (!res.ok) throw new Error(res.status);
      alert('Pin usunięty');
      fetchAndRenderAll();
    } catch (err) {
      console.error('Delete pinned failed:', err);
      alert('Nie udało się usunąć pinu');
    }
  }

  // ===== Fetch + render both lists =====
  async function fetchAndRenderAll() {
    try {
      const pins = await fetchPins();
      renderUploadList(pins);
      renderDeleteList(pins);
    } catch (err) {
      console.error('Failed to fetch/render pins:', err);
      // optionally show placeholder
    }
  }

  // ===== Init =====
  document.addEventListener('DOMContentLoaded', () => {
    btnCreate.addEventListener('click', createPinned);
    fetchAndRenderAll();
  });
})();

