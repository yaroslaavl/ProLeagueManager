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
  enforceNumberLimits(document.getElementById('yearInput'), 1, 2025);
});
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
  const formInputs = document.querySelectorAll("input[required]"); // Все обязательные поля
  const password1 = document.getElementById("password1");
  const password2 = document.getElementById("password2");
  const password1Error = document.getElementById("password1-error");
  const password2Error = document.getElementById("password2-error");
  const registerBtn = document.getElementById("register-btn");

  function validatePassword() {
    const password = password1.value;
    const errors = [];

    // Условие 1: Пароль должен содержать цифры, буквы маленькие и большие
    if (!/[a-z]/.test(password)) errors.push("Small Letters");
    if (!/[A-Z]/.test(password)) errors.push("Big Letters");
    if (!/[0-9]/.test(password)) errors.push("Numbers");

    // Условие 2: Специальный знак
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Special symbol");

    // Условие 3: Только латиница
    if (/[^a-zA-Z0-9!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Latinic");

    // Условие 4: Минимум 8 символов
    if (password.length < 8) errors.push("Min 8 letters");

    // Отображение ошибок
    if (errors.length > 0) {

      password1.style.borderColor = "#EA3943";
      password1.textContent = "Troubles: " + errors.join(", ");
      return false;
    } else {

      password1.style.borderColor = "#16C784";
      return true;
    }
  }

  function validatePasswordMatch() {
    if (password1.value !== password2.value) {
      password1.style.borderColor = "#EA3943";
      password2.style.borderColor = "#EA3943";
      password2.textContent = "Password doesnt match";
      return false;
    }
    else {
      password1.style.borderColor = "#16C784"
      password2.style.borderColor = "#16C784";
      return true;
    }
  }

  function areAllFieldsFilled() {
    // Проверяем, заполнены ли все обязательные поля
    return Array.from(formInputs).every(input => input.value.trim() !== "");
  }

  function toggleRegisterButton() {
    // Проверяем все условия: заполненность полей, валидность пароля и совпадение паролей
    if (areAllFieldsFilled() && validatePassword() && validatePasswordMatch()) {
      registerBtn.disabled = false;
      registerBtn.style.opacity = "1";
      registerBtn.style.cursor = "pointer";
    } else {
      registerBtn.disabled = true;
      registerBtn.style.opacity = "0.5";
      registerBtn.style.cursor = "not-allowed";
    }
  }

  // События на изменение полей
  formInputs.forEach(input => {
    input.addEventListener("input", toggleRegisterButton);
  });

  password1.addEventListener("input", () => {
    validatePassword();
    toggleRegisterButton();
  });

  password2.addEventListener("input", () => {
    validatePasswordMatch();
    toggleRegisterButton();
  });
});
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
