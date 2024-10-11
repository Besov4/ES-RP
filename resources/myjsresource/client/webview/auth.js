document.addEventListener('DOMContentLoaded', () => {
    console.log("auth.js загружен");

    // Проверяем, доступен ли объект alt
    if (typeof alt !== 'undefined') {
        // Добавляем обработчик для события 'show', чтобы отобразить интерфейс
        alt.on('show', () => {
            console.log('Получено событие "show" для отображения интерфейса');
            document.body.style.display = 'block'; // Убедитесь, что WebView виден
        });

        // Функция для отображения сообщений с сервера
        alt.on('server:message', (message) => {
            alert(message);  // Показываем сообщение через alert
        });
    }

    // Скрываем весь интерфейс по умолчанию, пока не получим событие 'show'
    document.body.style.display = 'none';

    // Функция для авторизации
    window.login = function() {
        console.log("Функция login вызвана");
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (email && password) {
            console.log("Отправка данных для авторизации");
            alt.emit('client:login', email, password);  // Отправляем данные на сервер
        } else {
            alert("Введите все данные для авторизации");
        }
    };

    // Функция для регистрации
    window.register = function() {
        console.log("Функция register вызвана");
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const discordId = document.getElementById('registerDiscord').value;

        if (name && email && password && discordId) {
            console.log("Отправка данных для регистрации");
            alt.emit('client:register', name, email, password, discordId);  // Отправляем данные на сервер
        } else {
            alert("Введите все данные для регистрации");
        }
    };

    // Показ формы авторизации
    window.showLogin = function() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    };

    // Показ формы регистрации
    window.showRegister = function() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    };
});
