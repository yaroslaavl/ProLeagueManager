
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
  const emailInput = document.getElementById("emailInput");
  const sendButton = document.getElementById("sendButton");

  function toggleSendButton() {

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


  emailInput.addEventListener("input", toggleSendButton);


  toggleSendButton();
});


