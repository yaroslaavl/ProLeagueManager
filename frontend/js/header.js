
function getSportPreferences(){
  const sportType = localStorage.getItem('sportPreferences');


  const imageElement = document.getElementById('sport-image');
  const buttonElement = document.getElementById("sportyButton");

  if(sportType === 'e-sport'){
    imageElement.src = 'img/image%208.png';
    buttonElement.innerText = 'E-sporty';
  } else if(sportType === 'sport'){
    imageElement.src = 'img/sport.png';
    buttonElement.innerText = 'Sporty';
  } else {

    buttonElement.innerText = 'Sporty';
  }
}


function toggleSportyMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById("sportyDropdown");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}


function selectSport(value) {
  const buttonElement = document.getElementById("sportyButton");
  buttonElement.innerText = value;


  if (value === 'E-sporty'){
    document.getElementById('sport-image').src = 'img/image%208.png';
    localStorage.setItem('sportPreferences','e-sport');
    location.href = "esport-main-page.html";
  }
  else {
    document.getElementById('sport-image').src = 'img/sport.png';
    localStorage.setItem('sportPreferences','sport');
    location.href = "sport-main-page.html";
  }
  document.getElementById("sportyDropdown").style.display = "none";
}


document.addEventListener("click", function () {
  const menu = document.getElementById("sportyDropdown");
  if (menu) menu.style.display = "none";
});


document.addEventListener("DOMContentLoaded", function () {
  getSportPreferences();
});


function toggleZawodyMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById("zawodyDropdown");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}


function selectZawody(value) {
  const buttonElement = document.getElementById("zawodyButton");



  if (value === 'Ligi'){
    location.href = "leagues-page.html";

  }
  else if (value === 'Turnieje'){
    location.href = "tournaments-page.html";
  }


  document.getElementById("zawodyDropdown").style.display = "none";
}



document.addEventListener("click", function () {

  const sportyMenu = document.getElementById("sportyDropdown");
  if (sportyMenu) sportyMenu.style.display = "none";


  const zawodyMenu = document.getElementById("zawodyDropdown");
  if (zawodyMenu) zawodyMenu.style.display = "none";
});



function toMain(){
  const sportType = localStorage.getItem('sportPreferences');
  if(sportType === 'e-sport'){
    location.href = 'esport-main-page.html';
  } else{
    location.href = 'sport-main-page.html';
  }
}
