
  function toggleMenu() {
  const menuPopup = document.getElementById('menuPopup');
  menuPopup.style.display = menuPopup.style.display === 'flex' ? 'none' : 'flex';
}

  // Закрыть меню при клике вне
  document.addEventListener('click', function (event) {
  const menuPopup = document.getElementById('menuPopup');
  const menuButton = document.querySelector('.menu-btn');

  if (!menuPopup.contains(event.target) && !menuButton.contains(event.target)) {
  menuPopup.style.display = 'none';
}
});

