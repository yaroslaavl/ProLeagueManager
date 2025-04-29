async function refreshToken() {
  try {
    const url = "http://localhost:8765/auth/refresh-token";
    const refToken = localStorage.getItem("refToken");

    if (!refToken) throw new Error("Отсутствует refreshToken");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${refToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error("Ошибка при обновлении токена");

    const Tokens = await response.json();
    localStorage.setItem("accToken", Tokens.accessToken);
    localStorage.setItem("refToken", Tokens.refreshToken);
  } catch (err) {
    console.error("Ошибка обновления токена:", err);
    logOut();
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  try {

    const accToken = localStorage.getItem("accToken");
    const refToken = localStorage.getItem("refToken");

    if (!accToken || !refToken) {
      window.location.href = "main.html";
      return;
    }


    await refreshToken();


    await getRoles();



  } catch (err) {
    console.error("Ошибка при загрузке страницы:", err);
  }
});

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


async function getRoles() {
  try {
    const url = 'http://localhost:8765/user/role-group';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('accToken')}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error(`Ошибка загрузки ролей: ${response.status}`);

    const data = await response.json();


    document.getElementById('user_group').innerText = data.name.replace('_', ' ');


    const rolesContainer = document.getElementById('roles_list');
    rolesContainer.innerHTML = '';

    data.roles.forEach(role => {
      const roleElement = document.createElement('div');
      roleElement.classList.add('role-item');
      roleElement.innerHTML = `
        <p class="role-name" style="color: #3861FB; font-weight: bold;">${role.name.replace('_', ' ')}</p>
        <p class="role-description" style="font-size: 12px; color: #555;">${role.description || 'Brak opisu'}</p>
      `;
      rolesContainer.appendChild(roleElement);
    });

  } catch (err) {
    console.error("Ошибка загрузки ролей:", err);
  }
}


async function logOut() {
  try {
    const accToken = localStorage.getItem("accToken");
    const response = await fetch('http://localhost:8765/auth/logout', {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error(`Ошибка выхода: ${response.status}`);

  } catch (err) {
    console.error("Ошибка при выходе:", err);
  } finally {
    localStorage.clear();
    window.location.href = "main.html";
  }
}


