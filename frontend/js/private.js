document.addEventListener("DOMContentLoaded", async () => {
  try {

    const accToken = localStorage.getItem("accToken");
    const refToken = localStorage.getItem("refToken");

    if (!accToken || !refToken) {
      window.location.href = "main.html";
      return;
    }


    await refreshToken();


    await getUserData();




    checkVerifyButtonState();

  } catch (err) {
    console.error("Ошибка при загрузке страницы:", err);
  }
});


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


    const timeoutEnd = Date.now() + 60000;
    localStorage.setItem("verifyTimeout", timeoutEnd);
    updateVerifyButtonState(timeoutEnd);

  } catch (err) {
    console.error(err);
  }
}


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


function checkVerifyButtonState() {
  const savedTimeout = localStorage.getItem("verifyTimeout");
  if (savedTimeout && Date.now() < savedTimeout) {
    updateVerifyButtonState(Number(savedTimeout));
  }
}


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


function openOverlay() { document.getElementById('passwordOverlay').style.display = 'flex'; }
function closeOverlay() { document.getElementById('passwordOverlay').style.display = 'none'; }
function changePasswordOpenOverlay() { document.getElementById('changePasswordOverlay').style.display = 'flex'; }
function changePasswordCloseOverlay() { document.getElementById('changePasswordOverlay').style.display = 'none'; }
async function delAcc() {
  const passInput = document.getElementById('pass');
  const password = passInput.value.trim();
  if (!password) {
    alert('Пожалуйста, введите пароль.');
    return;
  }

  try {

    await refreshtoken();
    const accToken = localStorage.getItem('accToken');
    if (!accToken) throw new Error('Нет access token');


    const res = await fetch('http://localhost:8765/user/delete-user-account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('Ошибка при удалении аккаунта: ' + (err.message || res.statusText));
      return;
    }


    closeOverlay();
    localStorage.removeItem('accToken');
    localStorage.removeItem('refToken');



    window.location.href = 'login.html';
  }
  catch (e) {
    console.error('delAcc error:', e);
    alert('Не удалось удалить аккаунт. Смотрите консоль для деталей.');
  }
}

window.delAcc = delAcc;
