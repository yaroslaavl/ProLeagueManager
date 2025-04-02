function toggleSportyMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById("sportyDropdown");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

function selectSport(value) {
  document.getElementById("sportyButton").innerText = value;
  if (value === 'E-sporty'){
    document.getElementById('sport-image').src = 'img/image%208.png';
  }
  else{
    document.getElementById('sport-image').src = 'img/sport.png';
  }
  document.getElementById("sportyDropdown").style.display = "none";
}

// Закрытие при клике вне меню
document.addEventListener("click", function () {
  const menu = document.getElementById("sportyDropdown");
  if (menu) menu.style.display = "none";
});
