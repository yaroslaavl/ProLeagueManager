document.addEventListener("DOMContentLoaded", () => {
  const toggleCheckbox = document.getElementById("toggle1");

  toggleCheckbox.addEventListener("change", () => {
    if (toggleCheckbox.checked) {
      console.log("Toggle: ON"); // Сообщение при включении
    } else {
      console.log("Toggle: OFF"); // Сообщение при выключении
    }
  });
});
