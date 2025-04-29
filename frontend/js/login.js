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
function togglePassword(inputId, toggleButton) {
    const passwordField = document.getElementById(inputId);

    if (passwordField.type === "password") {
        passwordField.type = "text";
        toggleButton.src = "img/eye-open.svg";
    } else {
        passwordField.type = "password";
        toggleButton.src = "img/eye-close.svg";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll(".nav-links .link");


    const currentPage = window.location.pathname;

    links.forEach(link => {

        if (link.href.includes(currentPage)) {
            link.classList.add("active");
        } else {
            link.classList.add("dimmed");
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("a");

    links.forEach(link => {
        link.addEventListener("click", (e) => {

            if (!link.href.startsWith(window.location.origin) || link.href.includes("#")) {
                return;
            }

            e.preventDefault();


            document.body.classList.add("fade-out");


            setTimeout(() => {
                window.location.href = link.href;
            }, 500);
        });
    });
});
document.addEventListener("DOMContentLoaded", () => {
    const emailOrUsername = document.getElementById("emailOrUsername");
    const password = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");

    function areFieldsFilled() {

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


    emailOrUsername.addEventListener("input", toggleLoginButton);
    password.addEventListener("input", toggleLoginButton);


    toggleLoginButton();
});


