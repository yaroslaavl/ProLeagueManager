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
      password1Error.style.display = "flex";
      password1.style.borderColor = "rgb(234, 57, 67)";
      password1Error.textContent = "Troubles: " + errors.join(", ");
      return false;
    } else {
      password1Error.style.display = "none";
      password1.style.borderColor = "#16C784";
      return true;
    }
  }

  function validatePasswordMatch() {
    if (password1.value !== password2.value) {
      password2Error.style.display = "flex";
      password2.style.borderColor = "rgb(234, 57, 67)";
      password2Error.textContent = "Password doesnt match";
      return false;
    }
     else {
      password2Error.style.display = "none";
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
  const emailOrUsername = document.getElementById("emailOrUsername");
  const password = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");

  function areFieldsFilled() {
    // Проверяем, заполнены ли оба поля
    return emailOrUsername.value.trim() !== "" && password.value.trim() !== "";
  }

  function toggleLoginButton() {
    if (areFieldsFilled()) {
      loginBtn.disabled = false;
      loginBtn.style.opacity = "1";
      loginBtn.style.cursor = "pointer";
    } else {
      loginBtn.disabled = true;
      loginBtn.style.opacity = "0.5";
      loginBtn.style.cursor = "not-allowed";
    }
  }

  // Слушатели событий на ввод данных
  emailOrUsername.addEventListener("input", toggleLoginButton);
  password.addEventListener("input", toggleLoginButton);

  // Проверяем состояние кнопки при загрузке
  toggleLoginButton();
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


