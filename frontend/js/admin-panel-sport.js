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

// js/admin-panel-sport.js

document.addEventListener('DOMContentLoaded', () => {
  // общий заголовок авторизации
  const authHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('accToken')}`,
    'Content-Type': 'application/json'
  });

  // ===== 1) Создание нового спорта =====
  const createNameInput = document.querySelector('.create-new-sport .sport-name');
  const createEsportChk = document.querySelector('.create-new-sport input[type=checkbox]');
  const createBtn       = document.querySelector('.create-new-sport .create-sport');

  createBtn.addEventListener('click', async () => {
    const name    = createNameInput.value.trim();
    const isEsport = createEsportChk.checked;
    if (!name) {
      alert('Podaj nazwę sportu.');
      return;
    }
    try {
      console.log(name,isEsport)
      const res = await fetch(
        'http://localhost:8765/sport/create-new-sport',
        {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({ 'name':name, "isEsport": isEsport })
        }
      );
      if (!res.ok) throw new Error(res.status);
      alert(`Sport "${name}" został stworzony.`);
      createNameInput.value = '';
      createEsportChk.checked = false;
    } catch (err) {
      console.error('Błąd tworzenia sportu:', err);
      alert('Nie udało się stworzyć sportu.');
    }
  });

  // вспомогательный fetch для поиска по названию
  async function searchSports(query) {
    const res = await fetch(
      `http://localhost:8765/sport/get-sports-by-name?sportName=${encodeURIComponent(query)}`,
      { headers: authHeader() }
    );
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  }

  // ===== 2) Редактирование спорта =====
  const editInput   = document.querySelector('.edit-sport .sport-search-input');
  const editResults = document.querySelector('.edit-sport .sports-search-result');

  editInput.addEventListener('input', async () => {
    const q = editInput.value.trim();
    editResults.innerHTML = '';
    if (!q) return;
    try {
      const list = await searchSports(q);
      renderEditCards(list);
    } catch (err) {
      console.error('Błąd wyszukiwania do edycji:', err);
    }
  });

  function renderEditCards(sports) {
    editResults.innerHTML = '';
    sports.forEach(s => {
      const card = document.createElement('div');
      card.classList.add('sport-result');
      card.dataset.name     = s.name;
      card.dataset.isEsport = s.isEsport;
      card.style.position   = 'relative';

      card.innerHTML = `
        <p>${s.name}</p>
        <img src="img/style=linear.svg" class="sport-edit-toggle" alt="✎" title="Edytuj" style="cursor:pointer; width:20px;height: 20px">
      `;

      card.querySelector('.sport-edit-toggle')
        .addEventListener('click', e => {
          e.stopPropagation();
          toggleEditMenu(card);
        });

      // клик вне — закрываем все редакторы
      document.addEventListener('click', () => {
        const open = card.querySelector('.edit-dropdown');
        if (open) open.remove();
      });

      editResults.append(card);
    });
  }

  function toggleEditMenu(card) {
    const existing = card.querySelector('.edit-dropdown');
    if (existing) {
      existing.remove();
      return;
    }
    // закроем другие
    document.querySelectorAll('.edit-dropdown').forEach(d => d.remove());

    const oldName   = card.dataset.name;
    const oldEsport = card.dataset.isEsport === 'true';

    const menu = document.createElement('div');
    menu.classList.add('edit-dropdown');
    menu.style.position = 'absolute';
    menu.style.top      = '100%';
    menu.style.left     = '0';
    menu.style.background = '#fff';
    menu.style.border     = '1px solid #CFD6E4';
    menu.style.padding    = '10px';
    menu.style.zIndex     = '1000';
    menu.style.fontSize = '12px';
    menu.style.width = '92%';
    menu.style.borderRadius = '12px'

    menu.addEventListener('click', e => e.stopPropagation());

    // новое имя
    const nameInput = document.createElement('input');
    nameInput.type  = 'text';
    nameInput.value = oldName;
    nameInput.style.width = '120px';
    nameInput.style.width = '90%';
    nameInput.style.borderRadius = '6px';
    nameInput.style.border = 'none';
    nameInput.style.padding = '5px'
    nameInput.style.backgroundColor = '#EFF2F5';
    nameInput.style.color = '#808A9D';
    menu.appendChild(nameInput);

    // isEsport checkbox
    const label = document.createElement('label');
    label.style.display = 'block';
    label.style.margin = '8px 0';
    label.innerHTML = `<input type="checkbox" ${oldEsport ? 'checked' : ''}> Esport?`;
    const chk = label.querySelector('input');
    menu.appendChild(label);

    // кнопка save
    const btn = document.createElement('button');
    btn.textContent = 'Zapisz';
    btn.style.display = 'block';
    btn.style.marginTop = '6px';
    btn.style.backgroundColor = '#0d6efd';
    btn.style.color = '#ffffff';
    btn.style.border = 'none';
    btn.style.borderRadius = '5px';
    btn.style.padding = '5px';
    btn.addEventListener('click', async () => {
      const newName  = nameInput.value.trim();
      const newEs    = chk.checked;
      if (!newName) {
        alert('Nazwa nie może być pusta.');
        return;
      }
      try {
        let res;
        console.log(newName,newEs)
        if(newName === oldName){
          res = await fetch(
            `http://localhost:8765/sport/edit-sport/${encodeURIComponent(oldName)}`,
            {
              method: 'PUT',
              headers: authHeader(),
              body: JSON.stringify({ isEsport: newEs })
            }
          );
        }else{
          res = await fetch(
            `http://localhost:8765/sport/edit-sport/${encodeURIComponent(oldName)}`,
            {
              method: 'PUT',
              headers: authHeader(),
              body: JSON.stringify({ name:newName,isEsport: newEs })
            }
          );
        }

        if (!res.ok) throw new Error(res.status);
        alert(`Sport "${oldName}" zaktualizowany na "${newName}".`);
        card.querySelector('p').textContent = newName;
        card.dataset.name     = newName;
        card.dataset.isEsport = newEs;
        menu.remove();
      } catch (err) {
        console.error('Błąd edycji sportu:', err);
        alert('Nie udało się zaktualizować sportu.');
      }
    });
    menu.appendChild(btn);

    card.appendChild(menu);
  }

  // ===== 3) Удаление спорта =====
  const delInput   = document.querySelector('.delete-sport .sport-search-input');
  const delResults = document.querySelector('.delete-sport .sports-search-result');

  delInput.addEventListener('input', async () => {
    const q = delInput.value.trim();
    delResults.innerHTML = '';
    if (!q) return;
    try {
      const list = await searchSports(q);
      renderDeleteCards(list);
    } catch (err) {
      console.error('Błąd wyszukiwania do usuwania:', err);
    }
  });

  function renderDeleteCards(sports) {
    delResults.innerHTML = '';
    sports.forEach(s => {
      const card = document.createElement('div');
      card.classList.add('sport-result-delete');
      card.dataset.name = s.name;

      card.innerHTML = `
        <p>${s.name}</p>
        <img src="img/trash.svg" class="sport-delete-btn" alt="🗑" title="Usuń" style="cursor:pointer; width:20px;">
      `;

      card.querySelector('.sport-delete-btn')
        .addEventListener('click', async () => {
          if (!confirm(`Usuń sport "${s.name}"?`)) return;
          try {
            const res = await fetch(
              `http://localhost:8765/sport/delete-sport/${encodeURIComponent(s.name)}`,
              { method: 'DELETE', headers: authHeader() }
            );
            if (!res.ok) throw new Error(res.status);
            alert(`Sport "${s.name}" został usunięty.`);
            card.remove();
          } catch (err) {
            console.error('Błąd usuwania sportu:', err);
            alert('Nie udało się usunąć sportu.');
          }
        });

      delResults.append(card);
    });
  }
});
