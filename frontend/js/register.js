
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
  enforceNumberLimits(document.getElementById('yearInput'), 1, 2025);
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
  const formInputs = document.querySelectorAll("input[required]");
  const password1 = document.getElementById("password1");
  const password2 = document.getElementById("password2");
  const password1Error = document.getElementById("password1-error");
  const password2Error = document.getElementById("password2-error");
  const registerBtn = document.getElementById("register-btn");

  function validatePassword() {
    const password = password1.value;
    const errors = [];


    if (!/[a-z]/.test(password)) errors.push("Small Letters");
    if (!/[A-Z]/.test(password)) errors.push("Big Letters");
    if (!/[0-9]/.test(password)) errors.push("Numbers");


    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Special symbol");


    if (/[^a-zA-Z0-9!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Latinic");


    if (password.length < 8) errors.push("Min 8 letters");


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

    return Array.from(formInputs).every(input => input.value.trim() !== "");
  }

  function toggleRegisterButton() {

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
