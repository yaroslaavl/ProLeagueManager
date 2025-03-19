document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Проверяем наличие токенов
    const accToken = localStorage.getItem("accToken");
    const refToken = localStorage.getItem("refToken");

    if (!accToken || !refToken) {
      window.location.href = "main.html";
      return;
    }

    // Обновляем токены перед загрузкой данных
    await refreshToken();

    // Загружаем данные пользователя
    await getUserData();

    // Устанавливаем обработчик на загрузку страницы для метрик
    setupPageLoadMetrics();

    // Проверяем сохранённый таймаут кнопки верификации
    checkVerifyButtonState();

  } catch (err) {
    console.error("Ошибка при загрузке страницы:", err);
  }
});

// Функция обновления токена
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

// Функция получения данных пользователя
async function getUserData() {
  try {
    const url = "http://localhost:8765/user/profile";
    const accToken = localStorage.getItem('accToken');

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error(`Ошибка загрузки данных: ${response.status}`);

    const data = await response.json();

    // Обновляем UI
    document.getElementById('e-mail').innerText = data.email;
    const statusElement = document.getElementById('status');
    const verifyBtn = document.getElementById('verify');

    if (data.isVerified) {
      statusElement.innerHTML = "On";
      statusElement.style.color = "green";
      verifyBtn.remove();
    } else {
      statusElement.innerHTML = "Off";
      statusElement.style.color = "red";
    }

  } catch (err) {
    console.error("Ошибка загрузки данных пользователя:", err);
  }
}

// Функция выхода из системы
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

// Функция измерения времени загрузки страницы
function setupPageLoadMetrics() {
  const pageLoadSpan = document.querySelector(".footer-content span:nth-child(3)");
  const htmlLoadSpan = document.querySelector(".footer-content span:nth-child(4)");

  if (pageLoadSpan && htmlLoadSpan) {
    window.addEventListener("load", () => {
      setTimeout(() => {
        const timing = performance.timing;

        const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        const htmlLoadTime = timing.responseEnd - timing.responseStart;

        const validPageLoadTime = pageLoadTime > 0 ? pageLoadTime : performance.now();
        const validHtmlLoadTime = htmlLoadTime > 0 ? htmlLoadTime : 0;

        pageLoadSpan.innerHTML = `Strona: <span class="blue">${Math.round(validPageLoadTime)}ms</span>`;
        htmlLoadSpan.innerHTML = `Szablon: <span class="blue">${Math.round(validHtmlLoadTime)}ms</span>`;

        console.log("Page Load Time (ms):", validPageLoadTime);
        console.log("HTML Load Time (ms):", validHtmlLoadTime);
      }, 0);
    });
  }
}

// Функция верификации email
async function verifyEmail() {
  try {
    const accToken = localStorage.getItem('accToken');
    const url = "http://localhost:8765/user/resend-activation-email";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error("Ошибка запроса");

    alert("Powiadomienie o weryfikacji było wysłane");

    // Устанавливаем таймаут
    const timeoutEnd = Date.now() + 60000;
    localStorage.setItem("verifyTimeout", timeoutEnd);
    updateVerifyButtonState(timeoutEnd);

  } catch (err) {
    console.error(err);
  }
}

// Функция обновления состояния кнопки верификации
function updateVerifyButtonState(timeoutEnd) {
  const verifyButton = document.getElementById("verify");
  const interval = setInterval(() => {
    const remainingTime = timeoutEnd - Date.now();

    if (remainingTime > 0) {
      verifyButton.disabled = true;
      verifyButton.textContent = `Prosze poczekać ${Math.ceil(remainingTime / 1000)} sec.`;
    } else {
      verifyButton.disabled = false;
      verifyButton.textContent = "Zweryfikować";
      localStorage.removeItem("verifyTimeout");
      clearInterval(interval);
    }
  }, 1000);
}

// Проверяем сохранённый таймаут при загрузке страницы
function checkVerifyButtonState() {
  const savedTimeout = localStorage.getItem("verifyTimeout");
  if (savedTimeout && Date.now() < savedTimeout) {
    updateVerifyButtonState(Number(savedTimeout));
  }
}

// Функции для работы с паролями и удалением аккаунта
async function updatePassword() {
  try {
    const accToken = localStorage.getItem('accToken');
    const url = "http://localhost:8765/user/change-user-password";
    const oldPassword = document.getElementById("oldPass").value;
    const newPassword = document.getElementById("newPass").value;

    const response = await fetch(url, {
      method: "PUT",
      body: JSON.stringify({ oldPassword, newPassword }),
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error("Ошибка смены пароля");

    changePasswordCloseOverlay();
    localStorage.clear();
    window.location.href = "login.html";

  } catch (err) {
    console.error(err);
  }
}

// Открытие/закрытие оверлеев
function openOverlay() { document.getElementById('passwordOverlay').style.display = 'flex'; }
function closeOverlay() { document.getElementById('passwordOverlay').style.display = 'none'; }
function changePasswordOpenOverlay() { document.getElementById('changePasswordOverlay').style.display = 'flex'; }
function changePasswordCloseOverlay() { document.getElementById('changePasswordOverlay').style.display = 'none'; }
