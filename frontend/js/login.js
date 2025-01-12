
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


