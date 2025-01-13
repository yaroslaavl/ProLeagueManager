
const submit = document.getElementById("register-btn");

async function register() {
  try {
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const day = document.getElementById("dayInput").value.padStart(2, "0");
    const month = document.getElementById("monthInput").value.padStart(2, "0");
    const year = document.getElementById("yearInput").value.trim();
    const password = document.getElementById("password1").value.trim();

    const dateOfBirth = `${year}-${month}-${day}`;
    const user = {
      username,
      email,
      password,
      firstName,
      lastName,
      birthDate: dateOfBirth,
    };

    console.log("User data:", user);

    const url = "http://localhost:8765/auth/registration";
    const params = {
      method: "POST",
      body: JSON.stringify(user),
      headers: { "Content-type": "application/json" },
    };

    const response = await fetch(url, params);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Response data:", data);

    // Перенаправление только после успешной регистрации
    window.location.href = "http://localhost:63342/ProLeagueManager/frontend/login.html";
  } catch (err) {
    console.error(`Registration error: ${err.message}`);
  }
}

submit.addEventListener("click",register);
