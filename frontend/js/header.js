// Функция для получения сохранённых настроек при загрузке страницы
function getSportPreferences(){
  const sportType = localStorage.getItem('sportPreferences');

  // Получаем элементы для изменения изображения и текста кнопки
  const imageElement = document.getElementById('sport-image');
  const buttonElement = document.getElementById("sportyButton");

  if(sportType === 'e-sport'){
    imageElement.src = 'img/image%208.png';
    buttonElement.innerText = 'E-sporty';
  } else if(sportType === 'sport'){
    imageElement.src = 'img/sport.png';
    buttonElement.innerText = 'Sporty';
  } else {
    // Если выбора ещё не было, можно задать значение по умолчанию
    buttonElement.innerText = 'Sporty';
  }
}

// Функция для переключения отображения выпадающего меню
function toggleSportyMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById("sportyDropdown");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

// Функция выбора вида спорта
function selectSport(value) {
  const buttonElement = document.getElementById("sportyButton");
  buttonElement.innerText = value;

  // Изменяем изображение, сохраняем выбор в localStorage и переходим на нужную страницу
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

// Закрытие меню при клике вне его области
document.addEventListener("click", function () {
  const menu = document.getElementById("sportyDropdown");
  if (menu) menu.style.display = "none";
});

// При загрузке страницы запускаем функцию получения настроек
document.addEventListener("DOMContentLoaded", function () {
  getSportPreferences();
});

// Функция для переключения меню «Zawody»
function toggleZawodyMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById("zawodyDropdown");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

// Функция выбора пункта в меню «Zawody»
function selectZawody(value) {
  const buttonElement = document.getElementById("zawodyButton");


  // В зависимости от выбора можно перейти на нужную страницу
  if (value === 'Ligi'){
    location.href = "leagues-page.html";

  }
  else if (value === 'Turnieje'){
    location.href = "tournaments-page.html";
  }

  // Скрываем меню после выбора
  document.getElementById("zawodyDropdown").style.display = "none";
}


// Общий обработчик клика по документу – чтобы закрывать открытые меню
document.addEventListener("click", function () {
  // Закрываем меню «Sporty», если оно открыто
  const sportyMenu = document.getElementById("sportyDropdown");
  if (sportyMenu) sportyMenu.style.display = "none";

  // Закрываем меню «Zawody», если оно открыто
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
