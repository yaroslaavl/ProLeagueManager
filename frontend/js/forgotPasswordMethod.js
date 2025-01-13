
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
