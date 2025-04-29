
if (localStorage.getItem('accToken') !== null && localStorage.getItem('refToken') !== null) {
  refreshToken();
}

document.addEventListener("DOMContentLoaded", () => {
  const pageLoadSpan = document.querySelector(".footer-content span:nth-child(3)");
  const htmlLoadSpan = document.querySelector(".footer-content span:nth-child(4)");

  if (pageLoadSpan && htmlLoadSpan) {
    window.addEventListener("load", () => {
      setTimeout(() => {
        const t = performance.timing;
        const pageLoadTime = t.loadEventEnd - t.navigationStart;
        const htmlLoadTime = t.responseEnd - t.responseStart;

        const validPageLoadTime = pageLoadTime > 0 ? pageLoadTime : performance.now();
        const validHtmlLoadTime = htmlLoadTime > 0 ? htmlLoadTime : 0;

        pageLoadSpan.innerHTML = `Strona: <span class="blue">${Math.round(validPageLoadTime)}ms</span>`;
        htmlLoadSpan.innerHTML = `Szablon: <span class="blue">${Math.round(validHtmlLoadTime)}ms</span>`;
      }, 0);
    });
  }
});

let accToken = localStorage.getItem("accToken");
let refToken = localStorage.getItem("refToken");
if (accToken === null || refToken === null) {
  const notifBtn = document.getElementById("notification_button");
  const burgerAndUser = document.getElementById("header_right");
  while (burgerAndUser.firstChild) burgerAndUser.removeChild(burgerAndUser.firstChild);
  while (notifBtn.firstChild) notifBtn.removeChild(notifBtn.firstChild);

  burgerAndUser.innerHTML = `
    <a href="login.html">
      <div class="registerBtn">
        <button class="register">Zaloguj sie</button>
      </div>
    </a>`;
  burgerAndUser.style.backgroundColor = "white";
}

async function refreshToken() {
  try {
    const url = "http://localhost:8765/auth/refresh-token";
    const ref = localStorage.getItem("refToken");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ref}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) throw new Error("Error Refresh Token");
    const Tokens = await response.json();
    localStorage.setItem("accToken", Tokens.accessToken);
    localStorage.setItem("refToken", Tokens.refreshToken);
  } catch (err) {
    console.error(err);
  }
}

async function logOut() {
  try {
    const token = localStorage.getItem("accToken");
    const response = await fetch('http://localhost:8765/auth/logout', {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  } catch (err) {
    console.error(err);
  } finally {
    localStorage.clear();
    window.location.href = "main.html";
  }
}

if (document.getElementById('log-out') !== null) {
  document.getElementById('log-out').addEventListener('click', logOut);
}



(() => {
  let gameSystemsMap = {};
  const API = 'http://localhost:8765';

  function hdr(contentType = 'application/json') {
    const t = localStorage.getItem('accToken');
    const h = t ? { 'Authorization': `Bearer ${t}` } : {};
    if (contentType) h['Content-Type'] = contentType;
    return h;
  }
  initGameSystemsMap();

  async function initGameSystemsMap() {
    await refreshToken();
    const systems = await fetch(`${API}/game-system/get-all`, { headers: hdr() }).then(r => r.json());
    systems.forEach(s => gameSystemsMap[s.id] = s);
  }

  const createForm      = document.querySelector('.create-competition');
  const nameInput       = createForm.querySelector('.competition-name-input input');
  const gameSystemSel   = createForm.querySelector('.competition-game-system select');
  const typeCheckboxes  = createForm.querySelectorAll(
    'input[type="checkbox"][value="LEAGUE"], input[type="checkbox"][value="TURNAMENT"]'
  );
  const dateInputs      = createForm.querySelectorAll('input[type="date"]');
  const btnCreate       = createForm.querySelector('button.create-sport');

  const editListDom     = document.querySelector('.change-competition .competitions-list');
  const deleteListDom   = document.querySelector('.delete-competition .competitions-list');


  const SPORT_ID = 2;


  async function fetchGameSystems() {
    await refreshToken();
    const res = await fetch(`${API}/game-system/get-all`, { headers: hdr() });
    if (!res.ok) throw new Error(`GameSystems: ${res.status}`);
    return await res.json();
  }
  async function renderGameSystems() {
    try {
      const systems = await fetchGameSystems();
      gameSystemSel.innerHTML = systems
        .map(s => `<option value="${s.id}">${s.systemName}</option>`)
        .join('');
    } catch (err) {
      console.error('Failed to load game systems:', err);
    }
  }


  async function createCompetition() {
    const name         = nameInput.value.trim();
    const gameSystemId = gameSystemSel.value;
    const typeChecked  = Array.from(typeCheckboxes).find(c => c.checked);
    const type         = typeChecked ? typeChecked.value : null;
    const start        = dateInputs[0].value + "T00:00:00";
    const end          = dateInputs[1].value + "T00:00:00";

    if (!name || !gameSystemId || !type || !start || !end) {
      alert('Wypełnij wszystkie pola.');
      return;
    }

    try {
      await refreshToken();
      const url  = `${API}/competition/create?gameSystemId=${encodeURIComponent(gameSystemId)}&sportId=${SPORT_ID}`;
      const body = { name:name, competitionType: type, startDate :   start, endDate: end };
      console.log(body)
      const res  = await fetch(url, {
        method: 'POST',
        headers: hdr(),
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text());
      alert('Zawody utworzone!');
      await fetchAndRenderCompetitions();

      nameInput.value = '';
      typeCheckboxes.forEach(cb => cb.checked = false);
      dateInputs.forEach(i => i.value = '');
    } catch (err) {
      console.error('Create competition failed:', err);
      alert('Nie udało się stworzyć zawodów.');
    }
  }


  async function fetchCompetitions() {
    const res = await fetch(`${API}/competition/all`, { headers: hdr() });
    if (!res.ok) throw new Error(`Competitions: ${res.status}`);
    return await res.json();
  }


  function uploadCompetitionImage(compId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      if (!input.files.length) return;
      const file = input.files[0];
      const fd   = new FormData();
      fd.append('competitionImage', file);
      try {
        const res = await fetch(
          `${API}/competition/upload-image/${encodeURIComponent(compId)}`,
          {
            method: 'POST',
            headers: hdr(null),
            body: fd
          }
        );
        if (!res.ok) throw new Error(await res.text());
        alert('Obrazek załadowany');
        await fetchAndRenderCompetitions();
      } catch (err) {
        console.error('Upload image failed:', err);
        alert('Nie udało się załadować obrazka.');
      }
    };
    input.click();
  }



  function renderEditList(comps) {
    editListDom.innerHTML = '';
    comps.forEach(c => {
      const div = document.createElement('div');
      div.className = 'competition';


      const imgEl = document.createElement('img');
      imgEl.className = 'competition-avatar';
      imgEl.style.cssText = 'border-radius:50%;width:40px;height:40px;object-fit:cover;';
      imgEl.src = 'img/blogo 2.png';

      fetch(`${API}/competition/get-image/${encodeURIComponent(c.id)}`, { headers: hdr() })
        .then(r => r.ok ? r.text() : Promise.reject())
        .then(url => { if (url) imgEl.src = url; })
        .catch(() => {});

      imgEl.onerror = () => { imgEl.src = 'img/blogo 2.png'; };

      div.appendChild(imgEl);

      div.insertAdjacentHTML('beforeend', `
      <p class="competition-name">${c.name}</p>
      <p class="competition-status">${c.status || '-'}</p>
      <img src="img/style=linear.svg" class="edit-btn" title="Edytuj"
           style="cursor:pointer;transform:rotate(90deg);width:30px;height:30px;">
      <img src="img/upload.svg" class="upload-btn" title="Załaduj obraz"
           style="cursor:pointer;width:30px;height:30px;margin-left:8px;">
    `);

      div.querySelector('.edit-btn').onclick   = () => editCompetition(c);
      div.querySelector('.upload-btn').onclick = () => uploadCompetitionImage(c.id);

      editListDom.appendChild(div);
    });
  }




  function renderDeleteList(comps) {
    deleteListDom.innerHTML = '';
    comps.forEach(c => {
      const div = document.createElement('div');
      div.className = 'competition';


      const imgEl = document.createElement('img');
      imgEl.className = 'competition-avatar';
      imgEl.style.cssText = 'border-radius:50%; width:40px; height:40px; object-fit:cover;';
      imgEl.src = 'img/blogo 2.png';


      fetch(`${API}/competition/get-image/${encodeURIComponent(c.id)}`, { headers: hdr() })
        .then(r => r.ok ? r.text() : Promise.reject())
        .then(url => {
          if (url) imgEl.src = url;
        })
        .catch(() => {

        });


      imgEl.onerror = () => {
        imgEl.src = 'img/blogo 2.png';
      };

      div.appendChild(imgEl);


      div.insertAdjacentHTML('beforeend', `
      <p class="competition-name">${c.name}</p>
      <p class="competition-status">${c.status || '-'}</p>
      <img src="img/trash.svg" class="delete-btn" title="Usuń"
           style="cursor:pointer; width:30px; height:30px;">
    `);

      div.querySelector('.delete-btn').onclick = () => deleteCompetition(c.name);

      deleteListDom.appendChild(div);
    });
  }


  async function editCompetition(comp) {
    const newName = prompt('Nowa nazwa:', comp.name);
    if (newName == null) return;
    try {
      const res = await fetch(
        `${API}/competition/edit/${encodeURIComponent(comp.name)}`,
        {
          method: 'PUT',
          headers: hdr(),
          body: JSON.stringify({
            name: newName,
            competitionType: comp.competitionType,
            startDate: comp.startDate,
            endDate: comp.endDate
          })
        }
      );
      if (!res.ok) throw new Error(await res.text());
      alert('Zawody zaktualizowane!');
      await fetchAndRenderCompetitions();
    } catch (err) {
      console.error('Edit competition failed:', err);
      alert('Nie udało się zmodyfikować zawodów.');
    }
  }



  async function deleteCompetition(name) {
    if (!confirm(`Usunąć zawody "${name}"?`)) return;

    try {

      const url = `${API}/competition/delete?competitionName=${encodeURIComponent(name)}`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers: hdr()
      });
      if (res.status === 204) {
        alert('Zawody usunięte!');
      } else if (res.status === 404) {
        alert('Zawody nie znalezione.');
      } else {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }


      await fetchAndRenderCompetitions();

    } catch (err) {
      console.error('Delete competition failed:', err);
      alert('Nie udało się usunąć zawodów.');
    }
  }






  document.addEventListener('DOMContentLoaded', async () => {
    await renderGameSystems();
    btnCreate.addEventListener('click', createCompetition);
    await fetchAndRenderCompetitions();
  });
  const disqListDom = document.querySelector('.disqualification-competition .competitions-list');



  async function fetchParticipants(compId) {
    const res = await fetch(`${API}/competition/participants/${encodeURIComponent(compId)}`, {
      headers: hdr()
    });
    if (!res.ok) throw new Error(`Participants ${compId}: ${res.status}`);
    return await res.json();
  }



  async function disqualifyParticipant(compId, teamId, userId) {
    const url = new URL(`${API}/competition/disqualify/${encodeURIComponent(compId)}`);
    if (teamId) url.searchParams.set('teamId', teamId);
    if (userId)  url.searchParams.set('userId', userId);

    const res = await fetch(url, {
      method: 'PUT',
      headers: hdr()
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Status ${res.status}`);
    }
  }



  function renderDisqList(comps) {
    const disqListDom = document.querySelector('.disqualification-competition .competitions-list');
    disqListDom.innerHTML = '';

    comps.forEach(c => {
      const div = document.createElement('div');
      div.className = 'competition';
      div.style.justifyContent = "space-between";
      div.innerHTML = `
      <img src="img/blogo 2.png" class="competition-avatar">
      <p class="competition-name">${c.name}</p>
      <p class="competition-status">${c.status || '-'}</p>
      <button class="view-btn" title="Pokaż uczestników">🔍</button>
      <div class="participants-list" style="display:none;padding-left:20px;"></div>
    `;

      const viewBtn  = div.querySelector('.view-btn');
      const partList = div.querySelector('.participants-list');

      viewBtn.onclick = async () => {
        // переключаем видимость
        if (partList.style.display === 'block') {
          partList.style.display = 'none';
          return;
        }
        partList.innerHTML = '<em>Ładowanie uczestników…</em>';
        partList.style.display = 'block';

        try {
          const parts = await fetchParticipants(c.id);
          // узнаём, командный ли это турнир
          const sys = gameSystemsMap[c.gameSystemId];
          const isTeamComp = sys && !sys.isIndividual;

          // создаём объект для дедупа:
          const unique = {};
          parts.forEach(p => {
            const key = isTeamComp
              ? `team_${p.teamId}`
              : `player_${p.playerId}`;
            if (p.teamId || p.playerId) unique[key] = p;
          });
          const toShow = Object.values(unique);

          if (!toShow.length) {
            partList.innerHTML = '<p><i>Brak zarejestrowanych uczestników</i></p>';
            return;
          }

          partList.innerHTML = '';
          for (const p of toShow) {
            // получаем мета-данные
            let info, label;
            if (p.teamId) {
              info = await fetch(`${API}/team/current/${p.teamId}`, { headers: hdr() }).then(r => r.json());
              label = `Zespół: ${info.teamName}`;
            } else {
              info = await fetch(`${API}/user/getUser/${p.playerId}`, { headers: hdr() }).then(r => r.json());
              label = `Gracz: ${info.username}`;
            }

            const item = document.createElement('div');
            item.className = 'participant-item';
            item.innerHTML = `
            <span class="participant-label">${label}</span>
            <button class="dq-btn">Diskwalifikuj</button>
          `;
            item.querySelector('.dq-btn').onclick = async () => {
              if (!confirm(`Na pewno dyskwalifikować ${label}?`)) return;
              await disqualifyParticipant(c.id, p.teamId, p.playerId);
              alert(`${label} został(a) zdyskwalifikowany(a).`);
              viewBtn.click(); // перекрываем и заново открываем, чтобы перерендерить
              viewBtn.click();
            };
            partList.appendChild(item);
          }
        } catch (e) {
          console.error(e);
          partList.innerHTML = '<p style="color:red;">Błąд ładowania uczestników.</p>';
        }
      };

      disqListDom.appendChild(div);
    });
  }



  async function fetchAndRenderCompetitions() {
    try {
      const comps = await fetchCompetitions();
      renderEditList(comps);
      renderDeleteList(comps);
      renderDisqList(comps);
    } catch (err) {
      console.error('Failed to fetch/render competitions:', err);
    }
  }
})();
