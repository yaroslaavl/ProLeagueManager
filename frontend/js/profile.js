// Функция для ограничения числовых значений в полях ввода
function enforceNumberLimits(input, min, max) {
  input.addEventListener('input', () => {
    const value = parseInt(input.value, 10);

    if (isNaN(value)) {
      input.value = ''; // Удаляет недопустимые символы
    } else if (value < min) {
      input.value = min; // Принудительно устанавливает минимальное значение
    } else if (value > max) {
      input.value = max; // Принудительно устанавливает максимальное значение
    }
  });
}

// Убедимся, что DOM полностью загружен
document.addEventListener('DOMContentLoaded', () => {
  // Ограничиваем ввод для дня (1-31), месяца (1-12) и года (1900-2100)
  enforceNumberLimits(document.getElementById('dayInput'), 1, 31);
  enforceNumberLimits(document.getElementById('monthInput'), 1, 12);
  enforceNumberLimits(document.getElementById('yearInput'), 1900, new Date().getFullYear());
});
document.addEventListener("DOMContentLoaded", () => {
  const editAvatarBtn = document.getElementById("editAvatarBtn"); // Кнопка "Edytuj"
  const avatarInput = document.getElementById("avatarInput"); // Скрытый input type="file"
  const avatarPreview = document.getElementById("avatarPreview"); // Изображение для превью

  // Обработчик нажатия на кнопку "Edytuj"
  editAvatarBtn.addEventListener("click", () => {
    avatarInput.click(); // Открыть диалог выбора файла
  });

  // Обработчик выбора файла
  avatarInput.addEventListener("change", () => {
    const file = avatarInput.files[0]; // Получаем выбранный файл
    if (file) {
      const reader = new FileReader();

      // Событие завершения чтения файла
      reader.onload = (e) => {
        avatarPreview.src = e.target.result; // Устанавливаем выбранное изображение как превью
      };

      reader.readAsDataURL(file); // Читаем файл как Data URL
    }
  });
});
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
const logOutBtn = document.getElementById('log-out').addEventListener('click',logOut);
