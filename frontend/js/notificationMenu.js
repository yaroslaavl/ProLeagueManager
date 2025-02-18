// 🔹 Funkcja otwierania/zamykania menu powiadomień
window.toggleNotifications = function (event) {
  const notificationPopup = document.getElementById("notificationPopup");
  notificationPopup.classList.toggle("active");
  event.stopPropagation();
};

// 🔹 Zamknięcie menu po kliknięciu poza nim
document.addEventListener("click", function (event) {
  const notificationPopup = document.getElementById("notificationPopup");
  const notificationButton = document.getElementById("notification_button");

  if (notificationPopup.classList.contains("active") && !notificationButton.contains(event.target)) {
    notificationPopup.classList.remove("active");
  }
});

// 🔹 Zapobieganie zamykaniu menu po kliknięciu wewnątrz
document.getElementById("notificationPopup").addEventListener("click", function (event) {
  event.stopPropagation();
});

// 🔹 Funkcja łączenia z SSE
// 🔹 Funkcja łączenia z SSE
async function connectSSE(userId) {
  const eventSource = new EventSource(`http://localhost:8765/my-notifications/subscribe/${userId}`);

  eventSource.onopen = () => {
    console.log("🔗 SSE: Połączenie nawiązane.");
  };

  eventSource.onmessage = (event) => {
    console.log("📩 Nowe powiadomienie:", event.data);

    let notification;
    try {
      notification = JSON.parse(event.data); // Próba parsowania JSON
    } catch (error) {
      console.warn("⚠ Otrzymano tekst zamiast JSON, wyświetlamy jako wiadomość:", event.data);
      notification = { message: event.data, eventType: "INFO", createdAt: new Date().toISOString(), isRead: false };
    }

    showToast(notification.message);
    addNotificationToMenu(notification);
  };

  eventSource.onerror = () => {
    console.error("❌ Błąd SSE. Ponowna próba połączenia za 3 sek...");
    eventSource.close();
    setTimeout(() => connectSSE(userId), 3000); // 🔄 Ponowne połączenie po 3 sek.
  };
}


// 🔹 Pobranie użytkownika i wszystkich powiadomień
document.addEventListener("DOMContentLoaded", async () => {
  await refreshtoken();
  const userId = await GetUserId();
  if (!userId) {
    console.error("⚠ Błąd: Nie udało się pobrać userId!");
    return;
  }

  await getAllNotifications(userId);
  connectSSE(userId);
});

// 🔹 Funkcja wyświetlania powiadomienia (toast)
function showToast(message) {
  const toastContainer = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.classList.add("toast");
  toast.innerText = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// 🔹 Funkcja dodawania powiadomień do menu
function addNotificationToMenu(notification) {
  const notificationList = document.querySelector(".notification-list");

  const notificationItem = document.createElement("div");
  notificationItem.classList.add("notification-item");

  // Sprawdzenie, czy wiadomość jest przeczytana
  if (!notification.isRead) {
    notificationItem.classList.add("unread"); // Można dodać specjalny styl dla nieprzeczytanych
  }

  notificationItem.innerHTML = `
        <p class="notification-message"><strong>${notification.eventType}</strong>: ${notification.message}</p>
        <span class="notification-time">${new Date(notification.createdAt).toLocaleDateString()}</span>
    `;

  notificationList.prepend(notificationItem);

  if (notificationList.children.length > 20) {
    notificationList.removeChild(notificationList.lastChild);
  }
}

// 🔹 Pobranie userId
async function GetUserId() {
  try {
    const response = await fetch("http://localhost:8765/user/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accToken')}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error(`Błąd ${response.status}`);

    const user = await response.json();
    return user.id;
  } catch (err) {
    console.error("❌ Błąd pobierania userId:", err);
    return null;
  }
}

// 🔹 Pobranie wszystkich powiadomień
async function getAllNotifications(userId) {
  try {
    const accToken = localStorage.getItem("accToken");

    const response = await fetch("http://localhost:8765/my-notifications/get-all-notifications", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: userId }),
    });

    if (!response.ok) throw new Error(`Błąd ${response.status}`);

    const messages = await response.json();
    console.log("📜 Historia powiadomień:", messages);

    messages.forEach((msg) => addNotificationToMenu(msg));
  } catch (err) {
    console.error("❌ Błąd pobierania powiadomień:", err);
  }
}

// 🔹 Odświeżenie tokena

