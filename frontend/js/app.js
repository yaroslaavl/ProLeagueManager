
function togglePassword(inputId, toggleButton) {
  const passwordField = document.getElementById(inputId);

  if (passwordField.type === "password") {
    passwordField.type = "text";
    toggleButton.src = "img/eye-open.svg"; // Устанавливаем картинку "скрыть"
  } else {
    passwordField.type = "password";
    toggleButton.src = "img/eye-close.svg"; // Устанавливаем картинку "показать"
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".nav-links .link");

  // Получаем текущий URL
  const currentPage = window.location.pathname;

  links.forEach(link => {
    // Проверяем, соответствует ли href текущему пути
    if (link.href.includes(currentPage)) {
      link.classList.add("active"); // Добавляем активный класс
    } else {
      link.classList.add("dimmed"); // Делаем остальные ссылки полупрозрачными
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("a"); // Все ссылки на странице

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      // Исключаем переходы с якорями или внешние ссылки
      if (!link.href.startsWith(window.location.origin) || link.href.includes("#")) {
        return;
      }

      e.preventDefault(); // Отменяем стандартный переход

      // Добавляем класс для анимации
      document.body.classList.add("fade-out");

      // Переходим на новую страницу после завершения анимации
      setTimeout(() => {
        window.location.href = link.href;
      }, 500); // Время должно совпадать с длительностью анимации
    });
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("emailInput"); // Поле для ввода email
  const sendButton = document.getElementById("sendButton"); // Кнопка "Wyślij"

  function toggleSendButton() {
    // Проверяем, заполнено ли поле email
    if (emailInput.value.trim() !== "") {
      sendButton.disabled = false;
      sendButton.style.opacity = "1";
      sendButton.style.cursor = "pointer";
    } else {
      sendButton.disabled = true;
      sendButton.style.opacity = "0.5";
      sendButton.style.cursor = "not-allowed";
    }
  }

  // Добавляем обработчик на изменение поля email
  emailInput.addEventListener("input", toggleSendButton);

  // Проверяем кнопку при загрузке страницы
  toggleSendButton();
});


