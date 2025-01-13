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
function enforceNumberLimits(input, min, max) {
  input.addEventListener('input', () => {
    const value = parseInt(input.value, 10);

    if (isNaN(value)) {
      input.value = ''; // Удаляет недопустимые символы
    } else if (value < min) {
      input.value = min; // Принудительно устанавливает минимальное значение
    } else if (value > max) {
      input.value = max; // Принудительно устанавливает максимальное значение
    }
  });
}
document.addEventListener('DOMContentLoaded', () => {
  // Ограничиваем ввод для дня (1-31), месяца (1-12) и года (1900-2100)
  enforceNumberLimits(document.getElementById('dayInput'), 1, 31);
  enforceNumberLimits(document.getElementById('monthInput'), 1, 12);
  enforceNumberLimits(document.getElementById('yearInput'), 1, 2025);
});
document.addEventListener("DOMContentLoaded", () => {
  const editAvatarBtn = document.getElementById("editAvatarBtn"); // Кнопка "Edytuj"
  const avatarInput = document.getElementById("avatarInput"); // Скрытый input type="file"
  const avatarPreview = document.getElementById("avatarPreview"); // Изображение для превью
  const accessToken = localStorage.getItem("accToken"); // Укажите ваш access token

  // Обработчик нажатия на кнопку "Edytuj"
  editAvatarBtn.addEventListener("click", () => {
    avatarInput.click(); // Открыть диалог выбора файла
  });

  // Обработчик выбора файла
  avatarInput.addEventListener("change", async () => {
    const file = avatarInput.files[0]; // Получаем выбранный файл
    if (file) {
      // Предварительный просмотр
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarPreview.src = e.target.result; // Устанавливаем выбранное изображение как превью
      };
      reader.readAsDataURL(file); // Читаем файл как Data URL

      // Отправка файла на сервер
      try {
        const formData = new FormData();
        formData.append("avatar", file);
        const accessToken = localStorage.getItem("accToken");
        const response = await fetch("http://localhost:8765/user/upload-user-avatar", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`
          },
          body: formData
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");

          if (contentType && contentType.includes("application/json")) {
            const result = await response.json();
            console.log("Avatar succefully changed:", result);
          } else {
            const textResponse = await response.text();
            console.log("Response from server:", textResponse);
          }
        } else {
          console.error("Error while updating avatar:", response.status, await response.text());
        }
      } catch (error) {
        console.error("Error while sending file:", error);
      }
    } else {
      console.error("File not choosen");
    }
  });
});

async function logOut(){
  try {
    const accToken = localStorage.getItem("accToken");
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
async function getUsername() {
  try {
    const url = "http://localhost:8765/user/profile";
    const accToken = localStorage.getItem("accToken");
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error("Error while fetch data");

    const data = await response.json();

    // Устанавливаем данные пользователя
    document.getElementById("nickname").value = data.username;
    document.getElementById("email").value = data.email;
    document.getElementById("firstName").value = data.firstName;
    document.getElementById("lastName").value = data.lastName;

    // Устанавливаем дату рождения
    const [year, month, day] = data.birthDate.split("-");
    document.getElementById("dayInput").value = day;
    document.getElementById("monthInput").value = month;
    document.getElementById("yearInput").value = year;

    // Загрузка аватара
    const avatarResponse = await fetch(`http://localhost:8765/user/avatar/${data.username}`);
    if (avatarResponse.ok) {
      const blob = await avatarResponse.blob();
      const objectURL = URL.createObjectURL(blob);
      document.getElementById("avatarPreview").src = objectURL;
    } else {
      console.warn("Аватар не найден:", avatarResponse.status);
    }
  } catch (err) {
    console.error(err);
  }
}
async function updateUserProfile(){
  try {
    const accToken = localStorage.getItem('accToken');
    const url = "http://localhost:8765/user/update-user-personal-data";
    const firstName = document.getElementById("firstName");
    const lastName = document.getElementById("lastName");
    const username = document.getElementById("nickname");
    const day = document.getElementById("dayInput");
    const month = document.getElementById("monthInput");
    const year = document.getElementById("yearInput");
    let birthDate = `${year.value}-${month.value.padStart(2, '0')}-${day.value.padStart(2, '0')}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username.value,
        firstName: firstName.value,
        lastName: lastName.value,
        birthDate: `${birthDate}`
      })
    });
    if(!response.ok)throw new Error("Error HTTP Request");
    console.log(response);
    alert("Dane profilu zmienione,redirect na strone loginu!");
    localStorage.clear();
    window.location.href = "login.html"
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

getUsername();
const submit = document.getElementById("submit").addEventListener('click',updateUserProfile);
