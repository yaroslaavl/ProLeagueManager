document.addEventListener("DOMContentLoaded", async () => {
  try {

    const accToken = localStorage.getItem("accToken");
    const refToken = localStorage.getItem("refToken");

    if (!accToken || !refToken) {
      window.location.href = "main.html";
      return;
    }


    await refreshToken();


    await getUsername();



  } catch (err) {
    console.error("Ошибка при загрузке страницы:", err);
  }
});


async function refreshToken() {
  try {
    const url = "http://localhost:8765/auth/refresh-token";
    const refToken = localStorage.getItem("refToken");

    if (!refToken) throw new Error("Отсутствует refreshToken");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${refToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error("Ошибка при обновлении токена");

    const Tokens = await response.json();
    localStorage.setItem("accToken", Tokens.accessToken);
    localStorage.setItem("refToken", Tokens.refreshToken);
  } catch (err) {
    console.error("Ошибка обновления токена:", err);
    logOut();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const pageLoadSpan = document.querySelector(".footer-content span:nth-child(3)");
  const htmlLoadSpan = document.querySelector(".footer-content span:nth-child(4)");

  if (pageLoadSpan && htmlLoadSpan) {

    window.addEventListener("load", () => {
      setTimeout(() => {
        const performanceTiming = performance.timing;


        const pageLoadTime = performanceTiming.loadEventEnd - performanceTiming.navigationStart;


        const htmlLoadTime = performanceTiming.responseEnd - performanceTiming.responseStart;


        const validPageLoadTime = pageLoadTime > 0 ? pageLoadTime : performance.now();
        const validHtmlLoadTime = htmlLoadTime > 0 ? htmlLoadTime : 0;


        pageLoadSpan.innerHTML = `Strona: <span class="blue">${Math.round(validPageLoadTime)}ms</span>`;
        htmlLoadSpan.innerHTML = `Szablon: <span class="blue">${Math.round(validHtmlLoadTime)}ms</span>`;


        console.log("Page Load Time (ms):", validPageLoadTime);
        console.log("HTML Load Time (ms):", validHtmlLoadTime);
      }, 0);
    });
  }
});


async function getUsername() {
  try {
    const url = "http://localhost:8765/user/profile";
    const accToken = localStorage.getItem("accToken");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error("Ошибка получения данных пользователя");

    const data = await response.json();


    document.getElementById("nickname").value = data.username;
    document.getElementById("email").value = data.email;
    document.getElementById("firstName").value = data.firstName;
    document.getElementById("lastName").value = data.lastName;


    const [year, month, day] = data.birthDate.split("-");
    document.getElementById("dayInput").value = day;
    document.getElementById("monthInput").value = month;
    document.getElementById("yearInput").value = year;


    const avatarResponse = await fetch(`http://localhost:8765/user/avatar/${data.username}`);
    if (avatarResponse.ok) {
      const blob = await avatarResponse.text();
      console.log(blob)
      document.getElementById("avatarPreview").src = blob;
    } else {
      console.warn("Аватар не найден:", avatarResponse.status);
    }
  } catch (err) {
    console.error("Ошибка загрузки профиля:", err);
  }
}


async function updateUserProfile() {
  try {
    const accToken = localStorage.getItem('accToken');
    const url = "http://localhost:8765/user/update-user-personal-data";

    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const username = document.getElementById("nickname").value;
    const day = document.getElementById("dayInput").value.padStart(2, '0');
    const month = document.getElementById("monthInput").value.padStart(2, '0');
    const year = document.getElementById("yearInput").value;

    let birthDate = `${year}-${month}-${day}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        firstName,
        lastName,
        birthDate
      })
    });

    if (!response.ok) throw new Error("Ошибка обновления данных");

    console.log("Данные успешно обновлены");
    alert("Dane profilu zmienione");
  } catch (err) {
    console.error(err);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const editAvatarBtn = document.getElementById("editAvatarBtn");
  const avatarInput = document.getElementById("avatarInput");
  const avatarPreview = document.getElementById("avatarPreview");
  const accessToken = localStorage.getItem("accToken");


  editAvatarBtn.addEventListener("click", () => {
    avatarInput.click();
  });


  avatarInput.addEventListener("change", async () => {
    const file = avatarInput.files[0];
    if (file) {

      const reader = new FileReader();
      reader.onload = (e) => {
        avatarPreview.src = e.target.result;
      };
      reader.readAsDataURL(file);


      try {
        const formData = new FormData();
        formData.append("avatar", file);
        const accessToken = localStorage.getItem("accToken");
        const response = await fetch("http://localhost:8765/user/upload-user-avatar", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`
          },
          body: formData
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");

          if (contentType && contentType.includes("application/json")) {
            const result = await response.json();
            console.log("Avatar succefully changed:", result);
          } else {
            const textResponse = await response.text();
            console.log("Response from server:", textResponse);
          }
        } else {
          console.error("Error while updating avatar:", response.status, await response.text());
        }
      } catch (error) {
        console.error("Error while sending file:", error);
      }
    } else {
      console.error("File not choosen");
    }
  });
});

async function logOut() {
  try {
    const accToken = localStorage.getItem("accToken");

    const response = await fetch('http://localhost:8765/auth/logout', {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error(`Ошибка выхода: ${response.status}`);

  } catch (err) {
    console.error("Ошибка при выходе:", err);
  } finally {
    localStorage.clear();
    window.location.href = "main.html";
  }
}


function enforceNumberLimits(input, min, max) {
  input.addEventListener('input', () => {
    const value = parseInt(input.value, 10);
    if (isNaN(value)) {
      input.value = '';
    } else if (value < min) {
      input.value = min;
    } else if (value > max) {
      input.value = max;
    }
  });
}


document.addEventListener('DOMContentLoaded', () => {
  enforceNumberLimits(document.getElementById('dayInput'), 1, 31);
  enforceNumberLimits(document.getElementById('monthInput'), 1, 12);
  enforceNumberLimits(document.getElementById('yearInput'), 1900, 2025);
});


document.getElementById("submit").addEventListener('click', updateUserProfile);
