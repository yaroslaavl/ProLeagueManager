refreshToken();
getUserData();
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
document.addEventListener("DOMContentLoaded",()=>{
  const accToken = localStorage.getItem("accToken");
  const refreshToken = localStorage.getItem("refToken");
  if(accToken === null || refreshToken === null){
    window.location.href = "main.html";
  }
})

const accToken = localStorage.getItem('accToken');
const deleteAcc = document.getElementById('deleteAcc').addEventListener('click',openOverlay);
const changePasswordOverlay = document.getElementById('changePassword').addEventListener('click',changePasswordOpenOverlay);
const verify = document.getElementById("verify").addEventListener('click',verifyEmail);
const changePassword = document.getElementById("updatePassword").addEventListener('click',updatePassword);

async function delAcc() {
  try {
    const url = "http://localhost:8765/user/delete-user-account";
    const password = document.getElementById('pass').value;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${accToken}`, // Добавляем заголовок Authorization
        "Content-Type": "application/json" // Указываем формат данных
      },
      body: JSON.stringify({ password }) // Отправляем объект JSON с паролем
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    alert("Account has been deleted.");
    localStorage.clear();
    window.location.href = "main.html";
  } catch (err) {
    console.error(err);
    alert('Nie poprawne haslo');
  }
}
async function getUserData(){
  try {
    const mail = document.getElementById('e-mail');
    const status = document.getElementById('status')
    const url = "http://localhost:8765/user/profile"
    const accToken = localStorage.getItem('accToken');
    const verifyBtn = document.getElementById('verify');
    const response = await fetch(url, {
      method: "GET", // Указываем метод GET
      headers: {
        "Authorization": `Bearer ${accToken}`, // Добавляем заголовок Authorization
        "Content-Type": "application/json" // Указываем формат данных
      }
    });
    if(!response.ok){
      throw new Error(`Error ${response.status}`);
    }
    const data = await response.json();
    if (data.isVerified === true){
      status.innerHTML = "On";
      status.style = "color: Green";
      verifyBtn.remove();
    }
    mail.innerHTML = data.email;
  }catch(err){
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
    if (!response.ok) throw new Error("HTTP Request error");

    console.log(response);
    alert("Powiadomienie o weryfikacji bylo wyslane");

    // Установить таймаут в localStorage
    const timeoutEnd = Date.now() + 60000; // 60 секунд (1 минута)
    localStorage.setItem("verifyTimeout", timeoutEnd);

    // Обновить состояние кнопки
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
// Проверяем сохранённый таймаут при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  const savedTimeout = localStorage.getItem("verifyTimeout");
  if (savedTimeout && Date.now() < savedTimeout) {
    updateVerifyButtonState(Number(savedTimeout));
  }
});
async function updatePassword(){
  try {
    const accToken = localStorage.getItem('accToken');
    const url = "http://localhost:8765/user/change-user-password";
    const oldPassword = document.getElementById("oldPass");
    const newPassword = document.getElementById("newPass");
    const response = await fetch(url, {
      method: "PUT",
      body: JSON.stringify({
        oldPassword: oldPassword.value,
        newPassword: newPassword.value
      }),
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      }
    });
    if(!response.ok)throw new Error("Error HTTP Request");
    console.log(response);
    changePasswordCloseOverlay();
    localStorage.clear();
    window.location.href = "login.html";
  }catch (err){
    console.error(err);
  }
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
function openOverlay() {
  const overlay = document.getElementById('passwordOverlay');
  overlay.style.display = 'flex';
}
function closeOverlay() {
  const overlay = document.getElementById('passwordOverlay');
  overlay.style.display = 'none';
}
function changePasswordOpenOverlay() {
  const overlay = document.getElementById('changePasswordOverlay');
  overlay.style.display = 'flex';
}
function changePasswordCloseOverlay() {
  const overlay = document.getElementById('changePasswordOverlay');
  overlay.style.display = 'none';
}

