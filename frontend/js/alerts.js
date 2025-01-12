refreshToken();
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
async function logOut(){
  try {
    let accToken = localStorage.getItem("accToken");
    let refToken = localStorage.getItem("refToken");
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
async function verifyEmail(){
  try {
    const url = "http://localhost:8765/user/resend-activation-email";
  const response = await fetch(url,{
    method:"POST",
    headers:{
      "Authorization": `Bearer ${null}`, // Добавляем заголовок Authorization
      "Content-Type": "application/json" // Указываем формат данных
    }
  });
  if(!response.ok)throw new Error("HTTP Request error");
  console.log(response.json());
  }catch(err){
    console.error(err);
  }
}
async function refreshToken(){
  try {
    const url = "http://localhost:8765/auth/refresh-token";
    const refToken = localStorage.getItem("refToken");
    const response = await fetch(url,{
      method:"POST",
      headers:{
        "Authorization": `Bearer ${refToken}`,
        "Content-Type": "application/json"
      }
    })
    if(!response.ok)throw new Error("Error Refresh Token");
    const Tokens = await response.json();
    localStorage.setItem("accToken",Tokens.accessToken);
    localStorage.setItem("refToken",Tokens.refreshToken);
  }catch (err){
    console.error(err);
  }
}
const logOutBtn = document.getElementById('log-out').addEventListener('click',logOut);
const verify = document.getElementById("verify").addEventListener('click',verifyEmail);
