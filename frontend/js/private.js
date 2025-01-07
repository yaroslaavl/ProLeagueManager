const logOutBtn = document.getElementById('log-out').addEventListener('click',logOut);
const accToken = localStorage.getItem('accToken');
const deleteAcc = document.getElementById('deleteAcc').addEventListener('click',openOverlay);
getUserData();


async function delAcc() {
  try {
    const url = "http://localhost:8765/user/delete-user-account";
    const password = document.getElementById('pass').value;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${accToken}`, // Добавляем заголовок Authorization
        "Content-Type": "application/json" // Указываем формат данных
      },
      body: JSON.stringify({ password }) // Отправляем объект JSON с паролем
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    alert("Account has been deleted.");
    localStorage.clear();
    window.location.href = "main.html";
  } catch (err) {
    console.error(err);
    alert('Nie poprawne haslo');
  }
}
async function getUserData(){
  try {
    const mail = document.getElementById('e-mail');
    const status = document.getElementById('status')
    const url = "http://localhost:8765/user/profile"
    const accToken = localStorage.getItem('accToken');
    const response = await fetch(url, {
      method: "GET", // Указываем метод GET
      headers: {
        "Authorization": `Bearer ${accToken}`, // Добавляем заголовок Authorization
        "Content-Type": "application/json" // Указываем формат данных
      }
    });
    if(!response.ok){
      throw new Error(`Error ${response.status}`);
    }
    const data = await response.json();
    if (data.isVerified === true){
      status.innerHTML = "On";
      status.style = "color: Green"
    }
    mail.innerHTML = data.email;
  }catch(err){
    console.error(err);
  }
}
async function logOut(){
  try {
    const response = await fetch('http://localhost:8765/auth/logout',{
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${accToken}`, // Добавляем заголовок Authorization
        "Content-Type": "application/json" // Указываем формат данных
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    localStorage.clear();
    window.location.href = "main.html";
  }catch (err){
    console.error(`${err}`);
  }
}

// Открытие оверлея
function openOverlay() {
  const overlay = document.getElementById('passwordOverlay');
  overlay.style.display = 'flex';
}
// Закрытие оверлея
function closeOverlay() {
  const overlay = document.getElementById('passwordOverlay');
  overlay.style.display = 'none';
}



