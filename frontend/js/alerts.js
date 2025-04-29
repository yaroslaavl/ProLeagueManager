getNotificationCheckboxes();
async function getNotificationCheckboxes(){
  try {
    await refreshToken();
    const accToken = localStorage.getItem('accToken');
    console.log(accToken);
    const url = 'http://localhost:8765/my-notifications/subscriptionList';
    const response = await fetch(url,{
      method: 'GET',
      headers:{
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      }
    })
    if(!response.ok)throw new Error(response.status);
    const data = await response.json();
    console.log(data);
    data.forEach((element)=>{
      console.log(element.eventCategory,element.isActive);
      if (element.eventCategory === 'GENERAL' && element.isActive === true) {
        document.getElementById('toggle1').checked = true;
      } else if (element.eventCategory === 'MATCH' && element.isActive === true) {
        document.getElementById('toggle3').checked = true;
      } else if (element.eventCategory === 'TOURNAMENT' && element.isActive === true) {
        document.getElementById('toggle4').checked = true;
      }else if (element.eventCategory === 'LEAGUE' && element.isActive === true){
        document.getElementById('toggle5').checked = true;
      }else if (element.eventCategory === 'TEAM' && element.isActive === true){
        document.getElementById('toggle6').checked = true;
      } else {
        console.error(`${element.eventCategory} are not exists`);
        return;
      }
    });
  }catch (err){
    console.error("Error while receiveing data from serwer");
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
document.addEventListener("DOMContentLoaded",()=>{
  const accToken = localStorage.getItem("accToken");
  const refreshToken = localStorage.getItem("refToken");
  if(accToken === null || refreshToken === null){
    window.location.href = "main.html";
  }
})
document.addEventListener("DOMContentLoaded", () => {
  const toggleCheckbox = document.getElementById("toggle1");

  toggleCheckbox.addEventListener("change", () => {
    if (toggleCheckbox.checked) {
      console.log("Toggle: ON");
    } else {
      console.log("Toggle: OFF");
    }
  });
});

const checkboxes = document.querySelectorAll('.toggle-checkbox');

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', (event) => {

    const id = event.target.id;
    const isChecked = event.target.checked;
    const accToken = localStorage.getItem('accToken');

    let eventCategory;
    if (id === 'toggle1') {
      eventCategory = 'GENERAL';
    } else if (id === 'toggle3') {
      eventCategory = 'MATCH';
    } else if (id === 'toggle4') {
      eventCategory = 'TOURNAMENT';
    }else if (id === 'toggle5'){
      eventCategory = 'LEAGUE';
    }else if (id === 'toggle6'){
      eventCategory = 'TEAM';
    } else {
      console.error(`${id}`);
      return;
    }


    const formData = new URLSearchParams();
    formData.append('eventCategory', eventCategory);
    formData.append('isActive', isChecked);


    fetch('http://localhost:8765/my-notifications/subscribeToNotification', {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${accToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Ошибка: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log(`Ответ сервера: ${data.message}`);
      })
      .catch((error) => {
        console.error('Ошибка при отправке запроса:', error);
      });
  });
});
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
async function logOut(){
  try {
    let accToken = localStorage.getItem("accToken");
    let refToken = localStorage.getItem("refToken");
    const response = await fetch('http://localhost:8765/auth/logout',{
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
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
