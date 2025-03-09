// 🔹 Функция открытия/закрытия меню уведомлений
window.toggleNotifications = function (event) {
  const notificationPopup = document.getElementById("notificationPopup");
  notificationPopup.classList.toggle("active");
  event.stopPropagation();
};

// 🔹 Закрытие меню при клике вне его
document.addEventListener("click", function (event) {
  const notificationPopup = document.getElementById("notificationPopup");
  const notificationButton = document.getElementById("notification_button");

  if (notificationPopup.classList.contains("active") && !notificationButton.contains(event.target)) {
    notificationPopup.classList.remove("active");
  }
});

// 🔹 Предотвращение закрытия меню при клике внутри
document.getElementById("notificationPopup").addEventListener("click", function (event) {
  event.stopPropagation();
});

// 🔹 Функция подключения к SSE
async function connectSSE(userId, token) {
  const eventSource = new EventSource(`http://localhost:8765/my-notifications/subscribe/${userId}?token=${token}`);

  eventSource.onopen = () => {
    console.log("🔗 SSE: Соединение установлено.");
  };

  eventSource.onmessage = (event) => {
    console.log("📩 Новое уведомление:", event.data);

    let notification;
    try {
      notification = JSON.parse(event.data);
    } catch (error) {
      console.warn("⚠ Получен текст вместо JSON, отображаем как сообщение:", event.data);
      notification = { message: event.data, eventType: "INFO", createdAt: new Date().toISOString(), isRead: false };
    }

    showToast(notification.message);
    addNotificationToMenu(notification);
  };

  eventSource.onerror = () => {
    console.error("❌ Ошибка SSE. Повторное подключение через 3 секунды...");
    eventSource.close();
    setTimeout(() => connectSSE(userId, token), 3000);
  };
}


// 🔹 Получение пользователя и всех уведомлений
document.addEventListener("DOMContentLoaded", async () => {
  await refreshtoken();
  const token = localStorage.getItem("accToken");
  const userId = await GetUserId(token);
  if (!userId) {
    console.error("⚠ Ошибка: Не удалось получить userId!");
    return;
  }

  await getAllNotifications(userId, token);
  connectSSE(userId, token);
});

// 🔹 Функция отображения уведомления (toast)
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

// 🔹 Функция добавления уведомлений в меню
function addNotificationToMenu(notification) {
  const notificationList = document.querySelector(".notification-list");
  const notificationItem = document.createElement("div");
  notificationItem.classList.add("notification-item");

  if (!notification.isRead) {
    notificationItem.classList.add("unread");
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

// 🔹 Получение userId
async function GetUserId(token) {
  try {
    const response = await fetch("http://localhost:8765/user/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error(`Ошибка ${response.status}`);

    const user = await response.json();
    return user.id;
  } catch (err) {
    console.error("❌ Ошибка получения userId:", err);
    return null;
  }
}

// 🔹 Получение всех уведомлений
async function getAllNotifications(userId, token) {
  try {
    const response = await fetch("http://localhost:8765/my-notifications/get-all-notifications", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: userId }),
    });

    if (!response.ok) throw new Error(`Ошибка ${response.status}`);

    const messages = await response.json();
    console.log("📜 История уведомлений:", messages);

    messages.forEach((msg) => addNotificationToMenu(msg));
  } catch (err) {
    console.error("❌ Ошибка получения уведомлений:", err);
  }
}
