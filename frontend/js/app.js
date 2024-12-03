// Функция для ограничения числовых значений
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

// Убедимся, что DOM полностью загружен
document.addEventListener('DOMContentLoaded', () => {
  enforceNumberLimits(document.getElementById('dayInput'), 1, 31);
  enforceNumberLimits(document.getElementById('monthInput'), 1, 12);
  enforceNumberLimits(document.getElementById('yearInput'), 1900, 2100);
});
function togglePassword(inputId) {
  const passwordField = document.getElementById(inputId);
  const toggleButton = passwordField.nextElementSibling;

  if (passwordField.type === "password") {
    passwordField.type = "text";
    toggleButton.textContent = "Ukryj";
  } else {
    passwordField.type = "password";
    toggleButton.textContent = "Pokaż";
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

