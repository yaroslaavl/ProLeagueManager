const submit = document.getElementById("loginBtn");

async function Login() {
  try {
    const emailOrUsername = document.getElementById("emailOrUsername").value.trim();
    const password = document.getElementById("password").value.trim();

    const url = "http://localhost:8765/auth/login";
    const user = {
      email: emailOrUsername,
      password: password,
    };

    const params = {
      method: "POST",
      body: JSON.stringify(user),
      headers: {
        "Content-type": "application/json",
      },
    };

    const response = await fetch(url, params);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Server response:", data);

    if (data.accessToken && data.refreshToken) {
      // Сохранение токенов
      localStorage.setItem("refToken", data.refreshToken);
      localStorage.setItem("accToken", data.accessToken);

      // Эффект fade-out перед переходом
      document.body.classList.add("fade-out");

      // Переход через 500 мс
      setTimeout(() => {
        window.location.href =
          "main.html";
      }, 500);
    } else {
      throw new Error("Missing tokens in server response");
    }
  } catch (err) {
    console.error(`Login error: ${err.message}`);
    alert("Nieprawidłowe dane logowania. Sprawdź swój e-mail lub hasło.");
    document.getElementById('password').style.borderColor = "#EA3943";
    document.getElementById('emailOrUsername').style.borderColor = "#EA3943"
  }
}

// Активация кнопки "Войти" при заполнении полей
document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", () => {
    const emailOrUsername = document.getElementById("emailOrUsername").value.trim();
    const password = document.getElementById("password").value.trim();
    const loginButton = document.getElementById("loginBtn");

    const isValid = emailOrUsername !== "" && password !== "";
    loginButton.disabled = !isValid;
    loginButton.style.opacity = isValid ? "1" : "0.5";
    loginButton.style.cursor = isValid ? "pointer" : "not-allowed";
  });
});

// Обработчик события
submit.addEventListener("click", (e) => {
  e.preventDefault(); // Предотвращает перезагрузку формы
  Login();
});
