
const submit = document.getElementById("register-btn");

async function register(){
  try {
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const firstName= document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const day = document.getElementById("dayInput").value;
    day<10 ? `0${day.toString()}`:day
    const month = document.getElementById("monthInput").value;
    month<10 ? `0${month.toString()}`:month
    const year = document.getElementById("yearInput").value;
    const dateOfBirth = `${year}-${ month<10 ? `0${month.toString()}`:month}-${day<10 ? `0${day.toString()}`:day}`
    const password = document.getElementById("password1").value;
    const user={
      username: `${username}`,
      email: `${email}`,
      password: `${password}`,
      firstName: `${firstName}`,
      lastName: `${lastName}`,
      birthDate:  dateOfBirth
    }
    console.log(user);
    const url = "http://localhost:8765/auth/registration";
    const params = {
      method: "POST",
      body: JSON.stringify(user),
      headers: {
        "Content-type": "application/json",
      }
    };
    const response = await fetch(url,params);
    if(!response.ok) throw new Error(`Error with HTTP Request ${response.status}`);

    console.log(response.json().then((val)=>{console.log(val)}));
    window.location.href = "http://localhost:63342/ProLeagueManager/frontend/login.html";

  }catch (err){
    console.error(`Error ${err}`);
  }
}
submit.addEventListener("click",register);
