// Функция для открытия/закрытия меню уведомлений
window.toggleNotifications = function(event) {
  const notificationPopup = document.getElementById('notificationPopup');
  notificationPopup.classList.toggle('active');

  // Останавливаем всплытие, чтобы меню не закрылось сразу
  event.stopPropagation();
};

// Закрытие уведомлений при клике вне их области
document.addEventListener('click', function(event) {
  const notificationPopup = document.getElementById('notificationPopup');
  const notificationButton = document.getElementById('notification_button');

  // Если меню активно и клик был не внутри него и не по кнопке, то закрываем
  if (notificationPopup.classList.contains('active') && !notificationButton.contains(event.target)) {
    notificationPopup.classList.remove('active');
  }
});

// Добавляем обработчик для предотвращения закрытия при клике внутри меню
document.getElementById('notificationPopup').addEventListener('click', function(event) {
  event.stopPropagation(); // Предотвращаем всплытие клика
});
