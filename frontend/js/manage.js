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
refreshToken();
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
async function getRoles() {
  try {
    const accToken = localStorage.getItem('accToken');
    const url = 'http://localhost:8765/user/role-group';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error(response.status);

    const data = await response.json();

    // Получаем название группы
    const groupName = data.name.replace('_', ' '); // Заменяем _ на пробел
    document.getElementById('user_group').innerText = groupName;

    // Получаем роли и добавляем их с описанием в колонку
    const rolesContainer = document.getElementById('roles_list');
    rolesContainer.innerHTML = ''; // Очищаем контейнер перед добавлением

    data.roles.forEach(role => {
      const roleName = role.name.replace('_', ' '); // Заменяем _ на пробел
      const roleDescription = role.description || 'Brak opisu'; // Подставляем описание или текст по умолчанию

      // Создаем элемент для отображения роли и её описания
      const roleElement = document.createElement('div');
      roleElement.classList.add('role-item'); // Для стилизации

      roleElement.innerHTML = `
        <p class="role-name" style="color: #3861FB; font-weight: bold;">${roleName}</p>
        <p class="role-description" style="font-size: 12px; color: #555;">${roleDescription}</p>
      `;
      rolesContainer.appendChild(roleElement);
    });
  } catch (err) {
    console.error(err);
  }
}
getRoles();
