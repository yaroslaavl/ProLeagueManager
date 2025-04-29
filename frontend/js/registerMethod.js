document.addEventListener("DOMContentLoaded", () => {
  const submit = document.getElementById("register-btn");

  submit.addEventListener("click", async () => {
    try {

      const username = document.getElementById("username").value.trim();
      const email = document.getElementById("email").value.trim();
      const firstName = document.getElementById("firstName").value.trim();
      const lastName = document.getElementById("lastName").value.trim();
      const day = document.getElementById("dayInput").value.padStart(2, "0");
      const month = document.getElementById("monthInput").value.padStart(2, "0");
      const year = document.getElementById("yearInput").value.trim();
      const password = document.getElementById("password1").value.trim();


      if (!username || !email || !firstName || !lastName || !day || !month || !year || !password) {
        alert("Wszystkie pola muszą być wypełnione!");
        return;
      }


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


      submit.disabled = true;


      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(user),
        headers: { "Content-type": "application/json" },
      });


      if (response.status === 409) {
        document.getElementById("username").style.borderColor = "#EA3943";
        document.getElementById("email").style.borderColor = "#EA3943";
        throw new Error("Nazwa użytkownika lub email już jest zajęta!");
      }


      if (!response.ok) {
        throw new Error(`Błąd serwera! Kod statusu: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);


      alert("Rejestracja zakończona sukcesem!");
      window.location.href = "login.html";

    } catch (err) {
      console.error(`Błąd rejestracji: ${err.message}`);
      alert(err.message);
    } finally {

      submit.disabled = false;
    }
  });


  const fields = ["username", "email"];
  fields.forEach((id) => {
    document.getElementById(id).addEventListener("input", function () {
      this.style.borderColor = "";
    });
  });
});
