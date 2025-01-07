const submit = document.getElementById("loginBtn");
async function Login() {
  try {
    const email = document.getElementById("emailOrUsername").value;
    const pass = document.getElementById("password").value;
    const url = "http://localhost:8765/auth/login";
    const user = {
      email: email,
      password: pass,
    };
    const params = {
      method: "POST",
      body: JSON.stringify(user),
      headers: {
        "Content-type": "application/json",
      },
    };
    const response = await fetch(url, params);
    if (!response.ok) throw new Error(`Error ${response.status}`);
    response.json().then((val) => {
      if (val.hasOwnProperty("accessToken") && val.hasOwnProperty("refreshToken")) {
        console.log("Welcome!");
        localStorage.setItem("refToken", val.refreshToken);
        localStorage.setItem("accToken", val.accessToken);
        document.body.classList.add("fade-out");

        setTimeout(() => {
          window.location.href =
            "http://localhost:63342/ProLeagueManager/frontend/main.html?_ijt=cdsh5k1fagkch182ldrjqnd9ks";
        }, 500);
      } else {
        throw new Error(`Error while receiving Token`);
      }
    });
  } catch (err) {
    console.error(`Error: ${err}`);
    alert("Nie prawidlowo podane haslo lub e-mail!");
  }
}
submit.addEventListener("click", Login);
