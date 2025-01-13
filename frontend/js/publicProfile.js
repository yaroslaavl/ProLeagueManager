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
refreshtoken();
const accToken = localStorage.getItem("accToken");
const refreshToken = localStorage.getItem("refToken");

if(accToken === null || refreshToken === null){
  window.location.href =
    "main.html";
}else{
  getUserData();
}

async function refreshtoken(){
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
async function getUserData() {
  try {
    const url = `http://localhost:8765/user/profile`;
    const response = await fetch(url, {
      method: "GET", // Указываем метод GET
      headers: {
        "Authorization": `Bearer ${accToken}`, // Добавляем заголовок Authorization
        "Content-Type": "application/json" // Указываем формат данных
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json(); // Парсим JSON-ответ
    console.log(data); // Выводим данные в консоль или используем их дальше
    const userName = data.username;
    const firstName = data.firstName;
    const lastName = data.lastName;
    const dateOfBirth = data.birthDate.split('-');
    let createdAt = new Date(data.createdAt).toLocaleDateString();
    let userImg;
    try {
      const res = await fetch(`http://localhost:8765/user/avatar/${userName}`);
      const urlImg =res.url;
      console.log(urlImg);
      userImg = urlImg;
    }catch (err){
      console.error('User image are not received!');
    }

  console.log(firstName + " " + lastName)
  document.getElementById('first_last_name').innerHTML = firstName + " " + lastName;
  document.getElementById("nickname").innerHTML = userName;
  document.getElementById("date_of_birth").innerHTML = dateOfBirth[2]+'.'+dateOfBirth[1]+'.'+dateOfBirth[0]
  document.getElementById("creation-date").innerHTML = createdAt
    document.getElementById('profile_img').src = userImg;
  } catch (err) {
    console.error(`Error: ${err}`);
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
const logOutBtn = document.getElementById('log-out').addEventListener('click',logOut);
