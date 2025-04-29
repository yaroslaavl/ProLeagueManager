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
document.getElementById("sendButton").addEventListener('click',sendResetPassword);
async function sendResetPassword(){
  try {
    const email = document.getElementById("emailInput").value;
    console.log(email);
    const url = "http://localhost:8765/user/send-reset-password"
    const response = await fetch(url,{
      method: "POST",
      body:JSON.stringify({
        email: email
      }),
      headers: {
        "Content-type": "application/json",
      },
    });
    if(!response.ok)throw new Error(response.status);
    window.location.href =
      "login.html";
  }catch (err){
    console.error(err);
  }
}
