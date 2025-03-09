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

async function fetchUserInfo() {
  if (!localStorage.getItem('accToken') || !localStorage.getItem('refToken')) {
    console.warn("Tokens are missing. User not logged in.");
    return;
  }

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

    if (!response.ok) throw new Error("Failed to fetch user profile");

    const data = await response.json();
    if (!data.username) throw new Error("Username is missing in response");

    // Получаем URL аватара из MinIO
    const userAvatar = await fetchUserAvatar(data.username) || "default-avatar.png"; // Подстраховка

    updateUser(data.username, data.email, userAvatar);
  } catch (error) {
    console.error('Error fetching user info:', error);
  }
}
async function fetchUserAvatar(username) {
  try {
    const res = await fetch(`http://localhost:8765/user/avatar/${username}`);
    if (!res.ok) throw new Error(`Avatar request failed with status: ${res.status}`);

    const urlImg = await res.text(); // Получаем строку вместо JSON
    console.log("Fetched avatar URL:", urlImg);

    return urlImg.startsWith("http") ? urlImg : "default-avatar.png"; // Проверяем, вернулся ли URL
  } catch (err) {
    console.warn("Error while receiving user photo:", err);
    return "default-avatar.png"; // Возвращаем дефолтный аватар при ошибке
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
