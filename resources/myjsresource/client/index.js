// Обновленный клиентский код с учетом всех необходимых изменений для более логичной работы интерфейса, включая перевод на русский и исправление логики нажатия кнопок

import * as alt from 'alt-client';
import * as native from 'natives'; // Подключаем natives API для работы с координатами

// Подключение WebView для отображения имен и интерфейса авторизации/регистрации
const view = new alt.WebView('file:///C:/altv-server/resources/myjsresource/client/webview/index.html');
const authView = new alt.WebView('file:///C:/altv-server/resources/myjsresource/client/webview/auth.html');

let isAuthViewActive = false; // Переменная для отслеживания состояния интерфейса авторизации
let isLoginInProgress = false; // Переменная для отслеживания состояния логина
let isCursorVisible = false; // Переменная для отслеживания состояния курсора

// Показать WebView при подключении игрока
authView.on('load', () => {
    alt.log('WebView загружен!');
    showCursor(true);
    authView.focus(); // Фокусируем WebView
    authView.emit('show'); // Отправляем событие для отображения интерфейса
    isAuthViewActive = true;
});

// Показ интерфейса регистрации/авторизации при подключении
alt.on('showAuthUI', () => {
    closeAllViews(); // Закрываем все интерфейсы перед показом авторизации
    showCursor(true); // Показать курсор мыши
    authView.focus(); // Фокусируем WebView
    authView.emit('show'); // Отправляем событие для отображения интерфейса
    isAuthViewActive = true; // Устанавливаем, что интерфейс авторизации активен
});

// Обработка событий с закрытием WebView
function closeAuthView() {
    if (authView) {
        authView.unfocus(); // Снимаем фокус с WebView
        authView.emit('hide'); // Скрываем интерфейс авторизации
        showCursor(false); // Скрываем курсор
        isAuthViewActive = false; // Интерфейс авторизации неактивен
        isLoginInProgress = false; // Сбрасываем состояние логина
    }
}

// Функция для закрытия всех интерфейсов
function closeAllViews() {
    authView.emit('hide');
    view.emit('hide');
    showCursor(false);
}

// Обработка регистрации
authView.on('client:register', (name, email, password, discordId) => {
    if (isLoginInProgress) return; // Если уже идет процесс логина/регистрации, блокируем повторное действие
    isLoginInProgress = true;
    alt.log(`Попытка регистрации: имя=${name}, email=${email}`);
    alt.emitServer('client:register', name, email, password, discordId); // Отправляем данные на сервер
});

// Обработка логина
authView.on('client:login', (email, password) => {
    if (isLoginInProgress) return; // Если уже идет процесс логина, блокируем повторное действие
    isLoginInProgress = true;
    alt.log(`Попытка логина: email=${email}`);
    alt.emitServer('client:login', email, password); // Отправляем данные на сервер
});

// Обработчик успешной авторизации (или регистрации)
alt.onServer('client:successLogin', (position) => {
    alt.log('Авторизация прошла успешно, закрываем интерфейс авторизации');
    closeAuthView(); // Закрываем интерфейс только после получения подтверждения от сервера
    spawnPlayer(position); // Спавним игрока на заданной позиции
});

// Обработчик ошибки авторизации
alt.onServer('client:loginError', (errorMessage) => {
    alt.log(`Ошибка авторизации: ${errorMessage}`); // Логируем ошибку для дебага
    isLoginInProgress = false; // Сбрасываем состояние логина при ошибке
    authView.emit('showError', errorMessage); // Покажи ошибку в WebView
});

// Функция для спавна игрока
function spawnPlayer(position) {
    alt.Player.local.pos = position;
    alt.log(`Игрок заспавнен на координатах: ${position.x}, ${position.y}, ${position.z}`);
}

// Функция для показа/скрытия курсора
function showCursor(state) {
    if (state && !isCursorVisible) {
        alt.showCursor(true);
        alt.toggleGameControls(false);
        isCursorVisible = true;
    } else if (!state && isCursorVisible) {
        alt.showCursor(false);
        alt.toggleGameControls(true);
        isCursorVisible = false;
    }
}

authView.on('load', () => {
    alt.log('WebView загружен и путь правильный!');
});