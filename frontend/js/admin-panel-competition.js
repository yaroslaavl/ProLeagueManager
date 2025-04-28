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


// js/admin-panel-competition.js
(() => {
  const API = 'http://localhost:8765';

  // Хелпер для заголовков с токеном
  function hdr(contentType = 'application/json') {
    const t = localStorage.getItem('accToken');
    const h = t ? { 'Authorization': `Bearer ${t}` } : {};
    if (contentType) h['Content-Type'] = contentType;
    return h;
  }

  // DOM-кеш
  const createForm      = document.querySelector('.create-competition');
  const nameInput       = createForm.querySelector('.competition-name-input input');
  const gameSystemSel   = createForm.querySelector('.competition-game-system select');
  const typeCheckboxes  = createForm.querySelectorAll(
    'input[type="checkbox"][value="LEAGUE"], input[type="checkbox"][value="TURNAMENT"]'
  );
  const dateInputs      = createForm.querySelectorAll('input[type="date"]'); // [0]=start, [1]=end
  const btnCreate       = createForm.querySelector('button.create-sport');

  const editListDom     = document.querySelector('.change-competition .competitions-list');
  const deleteListDom   = document.querySelector('.delete-competition .competitions-list');

  // Спорт (константа, заменить на нужный ID из UI если нужно)
  const SPORT_ID = 2;

  // Получить и отрисовать список игровых систем
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

  // Создать новое соревнование
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
      // сброс формы
      nameInput.value = '';
      typeCheckboxes.forEach(cb => cb.checked = false);
      dateInputs.forEach(i => i.value = '');
    } catch (err) {
      console.error('Create competition failed:', err);
      alert('Nie udało się stworzyć zawodów.');
    }
  }

  // Получить все соревнования
  async function fetchCompetitions() {
    const res = await fetch(`${API}/competition/all`, { headers: hdr() });
    if (!res.ok) throw new Error(`Competitions: ${res.status}`);
    return await res.json();
  }

  // Загрузить изображение для одного соревнования
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
            headers: hdr(null),  // без Content-Type, чтобы браузер сам проставил multipart
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

  // Рендер списка для редактирования
  // ===== Рендер списка для редактирования (с кнопками «✎» и «⬆️» загрузки) =====
  function renderEditList(comps) {
    editListDom.innerHTML = '';
    comps.forEach(c => {
      const div = document.createElement('div');
      div.className = 'competition';

      // создаём img элемент программно, чтобы повесить onerror
      const imgEl = document.createElement('img');
      imgEl.className = 'competition-avatar';
      imgEl.style.cssText = 'border-radius:50%;width:40px;height:40px;object-fit:cover;';
      imgEl.src = 'img/blogo 2.png'; // дефолт
      // пробуем подменить на реальный URL
      fetch(`${API}/competition/get-image/${encodeURIComponent(c.id)}`, { headers: hdr() })
        .then(r => r.ok ? r.text() : Promise.reject())
        .then(url => { if (url) imgEl.src = url; })
        .catch(() => {/* оставляем дефолт */});
      // если картинка не загрузилась (404, неверный URL и т.п.) — вернуть дефолт
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



  // Рендер списка для удаления
  function renderDeleteList(comps) {
    deleteListDom.innerHTML = '';
    comps.forEach(c => {
      const div = document.createElement('div');
      div.className = 'competition';

      // 1) создаём <img> с дефолтной иконкой
      const imgEl = document.createElement('img');
      imgEl.className = 'competition-avatar';
      imgEl.style.cssText = 'border-radius:50%; width:40px; height:40px; object-fit:cover;';
      imgEl.src = 'img/blogo 2.png';

      // 2) пытаемся получить реальный URL из API
      fetch(`${API}/competition/get-image/${encodeURIComponent(c.id)}`, { headers: hdr() })
        .then(r => r.ok ? r.text() : Promise.reject())
        .then(url => {
          if (url) imgEl.src = url;
        })
        .catch(() => {
          // оставляем дефолт
        });

      // 3) на случай, если картинка не загрузилась в <img> напрямую
      imgEl.onerror = () => {
        imgEl.src = 'img/blogo 2.png';
      };

      div.appendChild(imgEl);

      // остальная разметка
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

  // Редактирование соревнования через prompt
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

  // Удаление соревнования
  // ===== Удалить соревнование =====
  async function deleteCompetition(name) {
    if (!confirm(`Usunąć zawody "${name}"?`)) return;

    try {
      // Собираем URL под @DeleteMapping("/delete")
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

      // Обновляем списки
      await fetchAndRenderCompetitions();

    } catch (err) {
      console.error('Delete competition failed:', err);
      alert('Nie udało się usunąć zawodów.');
    }
  }


  // Fetch + render обеих списков


  // Инициализация
  document.addEventListener('DOMContentLoaded', async () => {
    await renderGameSystems();
    btnCreate.addEventListener('click', createCompetition);
    await fetchAndRenderCompetitions();
  });
  const disqListDom = document.querySelector('.disqualification-competition .competitions-list');

// ----------------------------
// Получить участников конкретного соревнования
  async function fetchParticipants(compId) {
    const res = await fetch(`${API}/competition/participants/${encodeURIComponent(compId)}`, {
      headers: hdr()
    });
    if (!res.ok) throw new Error(`Participants ${compId}: ${res.status}`);
    return await res.json();
  }

// ----------------------------
// Отправить запрос на дисквалификацию
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

// ----------------------------
// Рендер блока дисквалификации
  function renderDisqList(comps) {
    disqListDom.innerHTML = '';
    comps.forEach(c => {
      const div = document.createElement('div');
      div.style.justifyContent = "space-between";
      div.className = 'competition';
      div.innerHTML = `
      <img src="img/blogo 2.png" class="competition-avatar"
           style="border-radius:50%;width:40px;height:40px;object-fit:cover;">
      <p class="competition-name">${c.name}</p>
      <p class="competition-status">${c.status || '-'}</p>
      <button class="view-btn" title="Pokaż uczestników"
              style="cursor:pointer;">🕵️‍♂️</button>
      <div class="participants-list" style="display:none;padding-left:20px;"></div>
    `;
      // клик по «🕵️‍♂️» — загрузить и показать участников
      const viewBtn = div.querySelector('.view-btn');
      const partList = div.querySelector('.participants-list');
      viewBtn.onclick = async () => {
        try {
          // переключить видимость при повторном клике
          if (partList.style.display === 'block') {
            partList.style.display = 'none';
            return;
          }
          partList.innerHTML = '<em>Ładowanie uczestników…</em>';
          partList.style.display = 'block';

          const parts = await fetchParticipants(c.id);
          if (!parts.length) {
            partList.innerHTML = '<p><i>Brak zarejestrowanych uczestników</i></p>';
            return;
          }
          // отрисовать каждого с кнопкой «Diskwalifikuj»
          partList.innerHTML = '';
          for (const p of parts) {
            // подгружаем имя игрока, если есть playerId
            let label;
            if (p.playerId) {
              const u = await fetch(`${API}/user/getUser/${p.playerId}`, { headers: hdr() }).then(r => r.json());
              label = `Gracz: ${u.username}`;
            } else if (p.teamId) {
              // либо команда
              const t = await fetch(`${API}/team/current/${p.teamId}`, { headers: hdr() }).then(r => r.json());
              label = `Zespół: ${t.teamName}`;
            }
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.margin = '4px 0';
            item.innerHTML = `
            <span style="flex:1;">${label}</span>
            <button class="dq-btn" style="margin-left:10px;">Diskwalifikuj</button>
          `;
            // дисквалифицировать при клике
            item.querySelector('.dq-btn').onclick = async () => {
              if (!confirm(`Na pewno dyskwalifikować ${label}?`)) return;
              try {
                await disqualifyParticipant(c.id, p.teamId, p.playerId);
                alert(`${label} został(a) zdyskwalifikowany(a).`);
                // пересоздать список участников после дискв.
                viewBtn.click();     // скрыть
                viewBtn.click();     // показать заново
              } catch (e) {
                console.error(e);
                alert('Błąd podczas dyskwalifikacji.');
              }
            };
            partList.appendChild(item);
          }
        } catch (e) {
          console.error(e);
          partList.innerHTML = '<p style="color:red;">Błąd ładowania uczestników.</p>';
        }
      };

      disqListDom.appendChild(div);
    });
  }

// ----------------------------
// В fetchAndRenderCompetitions() в конце добавить вызов renderDisqList:
  async function fetchAndRenderCompetitions() {
    try {
      const comps = await fetchCompetitions();
      renderEditList(comps);
      renderDeleteList(comps);
      renderDisqList(comps);       // <-- вот сюда
    } catch (err) {
      console.error('Failed to fetch/render competitions:', err);
    }
  }
})();
