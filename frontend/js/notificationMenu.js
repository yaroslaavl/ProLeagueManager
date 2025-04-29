
window.toggleNotifications = function (event) {
  const notificationPopup = document.getElementById("notificationPopup");
  notificationPopup.classList.toggle("active");
  event.stopPropagation();
};

document.addEventListener("click", function (event) {
  const notificationPopup = document.getElementById("notificationPopup");
  const notificationButton = document.getElementById("notification_button");

  if (notificationPopup.classList.contains("active") && !notificationButton.contains(event.target)) {
    notificationPopup.classList.remove("active");
  }
});

document.getElementById("notificationPopup").addEventListener("click", function (event) {
  event.stopPropagation();
});


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


function addNotificationToMenu(notification) {
  const notificationList = document.querySelector(".notification-list");
  const notificationItem = document.createElement("div");
  notificationItem.classList.add("notification-item");

  if (!notification.isRead) {
    notificationItem.classList.add("unread");
  }


  let notificationHTML = `
        <p class="notification-message"><strong>${notification.eventType}</strong>: ${notification.message}</p>
        <span class="notification-time">${new Date(notification.createdAt).toLocaleDateString()}</span>
    `;


  if (notification.eventType === "TEAM_INVITATION") {
    const teamNameMatch = notification.message.match(/team:\s(.+)/);
    const teamName = teamNameMatch ? teamNameMatch[1] : "Nieznana drużyna";

    notificationHTML += `
        <div class="notification-actions">
            <button class="accept-btn" onclick="handleTeamInviteAccept('${teamName}', true)">Przyjąć</button>
            <button class="decline-btn" onclick="handleTeamInviteDecline('${teamName}', false)">Odrzucić</button>
        </div>
    `;
  }

  notificationItem.innerHTML = notificationHTML;
  notificationList.prepend(notificationItem);


  if (notificationList.children.length > 20) {
    notificationList.removeChild(notificationList.lastChild);
  }
}


async function handleTeamInviteAccept(teamName, accept) {
  try {
    const token = localStorage.getItem("accToken");
    const url = `http://localhost:8765/team/join-accept/${teamName}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ teamName: teamName }),
    });

    if (!response.ok) throw new Error(`Ошибка ${response.status}`);

    alert(`Zaproszenie ${accept ? "zaakceptowane" : "odrzucone"} do drużyny: ${teamName}`);
    location.reload();
  } catch (err) {
    console.error("❌ Ошибка обработки приглашения:", err);
    alert("Nie udało się przetworzyć zaproszenia. Spróbuj ponownie.");
  }
}
async function handleTeamInviteDecline(teamName, accept) {
  try {
    const token = localStorage.getItem("accToken");
    const url = `http://localhost:8765/team/join-reject/${teamName}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ teamName: teamName }),
    });

    if (!response.ok) throw new Error(`Ошибка ${response.status}`);

    alert(`Zaproszenie ${accept ? "zaakceptowane" : "odrzucone"} do drużyny: ${teamName}`);
    location.reload();
  } catch (err) {
    console.error("❌ Ошибка обработки приглашения:", err);
    alert("Nie udało się przetworzyć zaproszenia. Spróbuj ponownie.");
  }
}

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


