// Глобальная регистрация функций
window.toggleMenu = function(event) {
  const menuPopup = document.getElementById('menuPopup');
  menuPopup.classList.toggle('active');

  // Останавливаем всплытие события, чтобы меню не закрылось сразу же после открытия
  event.stopPropagation();
};

// Закрытие меню при клике вне его
document.addEventListener('click', function(event) {
  const menuPopup = document.getElementById('menuPopup');
  const menuContainer = document.querySelector('.menu-container'); // Включает кнопку меню и само меню

  // Если меню активно и клик был не внутри меню и не по кнопке открытия, то закрываем меню
  if (menuPopup.classList.contains('active') && !menuContainer.contains(event.target)) {
    menuPopup.classList.remove('active');
  }
});

// Назначаем обработчик клика на кнопку меню и иконку пользователя
document.querySelector('.menu-btn').addEventListener('click', window.toggleMenu);
document.querySelector('.profile-btn').addEventListener('click', window.toggleMenu);

// Обновление информации о пользователе
window.updateUser = function(name, email, avatar) {
  document.getElementById('userName').textContent = name;
  document.getElementById('userEmail').textContent = email;
  document.getElementById('avatarBurger').src = avatar;
};

// Получение информации о пользователе
async function fetchUserInfo() {
  if(localStorage.getItem('accToken') !== null && localStorage.getItem('refToken') !== null) {
    try {
      await refreshtoken();
      const accToken = localStorage.getItem('accToken');
      const response = await fetch('http://localhost:8765/user/profile', {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accToken}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      let userAvatar;
      try {
        const res = await fetch(`http://localhost:8765/user/avatar/${data.username}`);
        const urlImg = res.url;
        console.log(urlImg);
        userAvatar = urlImg;
      } catch (err) {
        console.error("Error while receiving user photo");
      }
      updateUser(data.username, data.email, userAvatar);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }
}

async function refreshtoken() {
  try {
    const url = "http://localhost:8765/auth/refresh-token";
    const refToken = localStorage.getItem("refToken");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${refToken}`,
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

// Вызов fetchUserInfo при загрузке
fetchUserInfo();
