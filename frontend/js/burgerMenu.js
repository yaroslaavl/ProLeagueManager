
window.toggleMenu = function(event) {
  const menuPopup = document.getElementById('menuPopup');
  menuPopup.classList.toggle('active');


  event.stopPropagation();
};


document.addEventListener('click', function(event) {
  const menuPopup = document.getElementById('menuPopup');
  const menuContainer = document.querySelector('.menu-container');


  if (menuPopup.classList.contains('active') && !menuContainer.contains(event.target)) {
    menuPopup.classList.remove('active');
  }
});


document.querySelector('.menu-btn').addEventListener('click', window.toggleMenu);
document.querySelector('.profile-btn').addEventListener('click', window.toggleMenu);


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


    const userAvatar = await fetchUserAvatar(data.username) || "default-avatar.png";

    updateUser(data.username, data.email, userAvatar);
  } catch (error) {
    console.error('Error fetching user info:', error);
  }
}
async function fetchUserAvatar(username) {
  try {
    const res = await fetch(`http://localhost:8765/user/avatar/${username}`);
    if (!res.ok) throw new Error(`Avatar request failed with status: ${res.status}`);

    const urlImg = await res.text();
    console.log("Fetched avatar URL:", urlImg);

    return urlImg.startsWith("http") ? urlImg : "default-avatar.png";
  } catch (err) {
    console.warn("Error while receiving user photo:", err);
    return "default-avatar.png";
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

fetchUserInfo();
async function fetchUserRoles() {
  try {
    const accToken = localStorage.getItem('accToken');
    if (!accToken) return;

    const res = await fetch('http://localhost:8765/user/role-group', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error('Не удалось получить роли');

    const data = await res.json();
    const roles = data.roles.map(r => r.name);


    const adminLink = document.getElementById('adminPanelLink');
    if (adminLink && !roles.includes('ADMIN') && !roles.includes('MODERATOR')) {

      adminLink.remove();


    }
  } catch (err) {
    console.error('Ошибка при проверке ролей:', err);
  }
}


document.addEventListener('DOMContentLoaded', () => {
  fetchUserInfo().finally(() => {
    fetchUserRoles();
  });
});
