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

(() => {
  const API = 'http://localhost:8765';

  function hdr(contentType = 'application/json') {
    const t = localStorage.getItem('accToken');
    const h = t ? { 'Authorization': `Bearer ${t}` } : {};
    if (contentType) h['Content-Type'] = contentType;
    return h;
  }


  const sportsSelect     = document.querySelector('.sport-menu select');
  const createNameInput  = document.querySelector('.create-system .system-name input');
  const createRulesInput = document.querySelector('.create-system .system-rules input');
  const createIndSelect  = document.querySelector('.create-system .isIndividual select');
  const createMinTeam    = document.querySelector('.create-system .minTeamSize input');
  const createMaxTeam    = document.querySelector('.create-system .maxTeamSize input');
  const createMinAge     = document.querySelector('.create-system .minAge input');
  const createMaxAge     = document.querySelector('.create-system .maxAge input');
  const createBtn        = document.querySelector('.create-system .create-sport');

  const deleteListDom    = document.querySelector('.delete-system .systems-list');
  const editListDom      = document.querySelector('.edit-system .systems-list');
  const searchInput      = document.querySelector('.search-system .input-system');
  const searchListDom    = document.querySelector('.search-system .systems-list');


  async function fetchSports() {
    const res = await fetch(`${API}/sport/allSports`, { headers: hdr() });
    if (!res.ok) throw new Error('Cannot load sports');
    return res.json();
  }
  async function renderSports() {
    try {
      const sports = await fetchSports();
      sportsSelect.innerHTML = sports.map(s =>
        `<option value="${s.id}">${s.name}</option>`
      ).join('');
    } catch (e) {
      console.error(e);
    }
  }


  async function fetchSystems() {
    const res = await fetch(`${API}/game-system/get-all`, { headers: hdr() });
    if (!res.ok) throw new Error('Cannot load game-systems');
    return res.json();
  }


  function renderSystemsList(container, systems, { onDelete, onEdit } = {}) {
    container.innerHTML = '';
    systems.forEach(sys => {
      const div = document.createElement('div');
      div.className = 'system';
      div.innerHTML = `
        <span>${sys.systemName}</span>
        ${ onEdit  ? `<button class="edit-btn">Edytuj</button>`  : '' }
        ${ onDelete? `<button class="del-btn">Usuń</button>`    : '' }
      `;
      if (onEdit) {
        div.querySelector('.edit-btn').onclick = () => onEdit(sys);
      }
      if (onDelete) {
        div.querySelector('.del-btn').onclick = () => onDelete(sys.id);
      }
      container.appendChild(div);
    });
  }


  async function createSystem() {
    const body = {
      sportId:       +sportsSelect.value,
      systemName:    createNameInput.value.trim(),
      rules:         createRulesInput.value.trim(),
      isIndividual:  createIndSelect.value === 'Tak',
      minTeamSize:   +createMinTeam.value,
      maxTeamSize:   +createMaxTeam.value,
      minAge:        +createMinAge.value,
      maxAge:        +createMaxAge.value
    };

    if (!body.systemName || isNaN(body.sportId)) {
      return alert('Wypełnij nazwę i sport');
    }
    const res = await fetch(`${API}/game-system/create`, {
      method: 'POST',
      headers: hdr(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      console.error(await res.text());
      return alert('Błąd tworzenia');
    }
    alert('System utworzony!');
    await reloadAll();

    createNameInput.value = '';
    createRulesInput.value = '';
  }


  async function deleteSystem(id) {
    if (!confirm('Na pewno usunąć?')) return;
    const res = await fetch(`${API}/game-system/delete/${id}`, {
      method: 'DELETE',
      headers: hdr()
    });
    if (res.ok) {
      alert('Usunięto');
      await reloadAll();
    } else {
      console.error(await res.text());
      alert('Błąd usuwania');
    }
  }


  async function editSystem(sys) {
    await refreshToken();

    const input = prompt(
      'Wprowadź aktualizację в формате "pole:wartość" (np. rules:Only deagles):',
      'rules:'
    );
    if (!input) return;


    const [rawKey, ...rest] = input.split(':');
    const key   = rawKey.trim();
    const value = rest.join(':').trim();
    if (!key) return alert('Niepoprawny format');

    let updates = { [key]: value };

    updates = {"rules":"ONLYD DEAGLE"};console.log(updates)
    const res = await fetch(`${API}/game-system/update/${sys.id}`, {
      method: 'PATCH',
      headers: hdr(),
      body: JSON.stringify(updates)
    });

    if (res.ok) {
      alert('Zaktualizowano!');
      await reloadAll();
    } else {
      console.error(await res.text());
      alert('Błąd edycji');
    }
  }





  async function reloadAll() {
    const all = await fetchSystems();
    renderSystemsList(deleteListDom, all, { onDelete: deleteSystem });
    renderSystemsList(editListDom,   all, { onEdit:   editSystem });
  }


  document.addEventListener('DOMContentLoaded', async () => {
    await renderSports();
    createBtn.addEventListener('click', createSystem);
    await reloadAll();


    let timeout;

  });
})();

