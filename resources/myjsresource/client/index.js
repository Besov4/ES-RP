// Обновленный клиентский код для исправления отображения интерфейса создания персонажа

import * as alt from 'alt-client';
import * as native from 'natives'; // Подключаем natives API для работы с координатами

// Подключение WebView для отображения имен и интерфейса авторизации/регистрации
const view = new alt.WebView('file:///C:/altv-server/resources/myjsresource/client/webview/index.html');
const authView = new alt.WebView('file:///C:/altv-server/resources/myjsresource/client/webview/auth.html');
const characterView = new alt.WebView('file:///C:/altv-server/resources/myjsresource/client/webview/character.html');
const createCharacterView = new alt.WebView('file:///C:/altv-server/resources/myjsresource/client/webview/createCharacter.html'); // Новый WebView для создания персонажа

let isAuthViewActive = false; // Переменная для отслеживания состояния интерфейса авторизации
let isLoginInProgress = false; // Переменная для отслеживания состояния логина
let isCursorVisible = false; // Переменная для отслеживания состояния курсора
let currentCharacterId = null; // Переменная для хранения текущего выбранного персонажа

// Функция закрытия всех интерфейсов
function closeAllViews() {
    if (authView) {
        authView.unfocus();
        authView.emit('hide');
    }
    if (characterView) {
        characterView.unfocus();
        characterView.emit('hide');
    }
    if (createCharacterView) {
        createCharacterView.unfocus();
        createCharacterView.emit('hide');
    }
    showCursor(false);
    isAuthViewActive = false;
    isLoginInProgress = false;
}

// Показать WebView при подключении игрока
authView.on('load', () => {
    alt.log('WebView загружен!');
    closeAllViews();
    showCursor(true);
    authView.focus(); // Фокусируем WebView
    authView.emit('show'); // Отправляем событие для отображения интерфейса
    isAuthViewActive = true;
});

// Показ интерфейса регистрации/авторизации при подключении
alt.on('showAuthUI', () => {
    closeAllViews();
    showCursor(true); // Показать курсор мыши
    authView.focus(); // Фокусируем WebView
    authView.emit('show'); // Отправляем событие для отображения интерфейса
    isAuthViewActive = true; // Устанавливаем, что интерфейс авторизации активен
});

// Показ интерфейса создания/выбора персонажа
function showCharacterSelection(characters) {
    closeAllViews(); // Закрываем все интерфейсы перед показом выбора персонажа

    if (!characters || characters.length === 0) {
        alt.log('Список персонажей пуст, показываем интерфейс создания персонажа.');
        createCharacterView.focus(); // Фокусируем WebView создания персонажа
        createCharacterView.emit('showCreateCharacter'); // Показываем интерфейс создания персонажа
        showCursor(true); // Показываем курсор
        return;
    }
    characterView.focus(); // Фокусируем WebView выбора персонажа
    characterView.emit('showCharacterSelection', characters); // Отправляем событие для отображения интерфейса выбора персонажа с доступными персонажами
    showCursor(true); // Показываем курсор
    alt.log('Показ интерфейса выбора персонажа'); // Логируем показ интерфейса выбора персонажа
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
alt.onServer('client:successLogin', (characters) => {
    alt.log('Авторизация прошла успешно, закрываем интерфейс авторизации');
    closeAllViews(); // Закрываем интерфейс только после получения подтверждения от сервера
    showCharacterSelection(characters); // Показ интерфейса выбора/создания персонажа с доступными персонажами
});

// Обработчик ошибки авторизации
alt.onServer('client:loginError', (errorMessage) => {
    alt.log(`Ошибка авторизации: ${errorMessage}`); // Логируем ошибку для дебага
    isLoginInProgress = false; // Сбрасываем состояние логина при ошибке
    authView.emit('showError', errorMessage); // Покажи ошибку в WebView
});

// Обработка создания нового персонажа
createCharacterView.on('client:createCharacter', (name, surname, model) => {
    if (!name || !surname || !model) {
        alt.logError('Ошибка: имя, фамилия или модель не определены. Создание персонажа не может быть обработано.');
        createCharacterView.emit('showError', 'Пожалуйста, заполните все поля для создания персонажа.');
        return;
    }
    alt.log(`Запрос на создание нового персонажа: ${name} ${surname}`);
    alt.emitServer('server:createCharacter', name, surname, model); // Отправляем данные на сервер для создания персонажа
});

// Обработка выбора существующего персонажа
characterView.on('client:selectCharacter', (characterId) => {
    alt.log(`Запрос на выбор персонажа с ID: ${characterId}`);
    if (characterId === undefined || characterId === null) {
        alt.logError('Ошибка: characterId не определен или имеет значение undefined. Выбор персонажа не может быть обработан.');
        return;
    }
    currentCharacterId = characterId;
    alt.emitServer('server:selectCharacter', characterId);
});

// Обработчик успешного создания персонажа
alt.onServer('client:characterCreated', (characterName, position) => {
    alt.log(`Персонаж ${characterName} успешно создан.`);
    closeAllViews();
    showCursor(false); // Скрываем курсор
    alt.emit('spawnPlayer', position); // Спавним игрока на заданной позиции
});

// Обработчик успешного выбора персонажа
alt.onServer('client:characterSelected', (position) => {
    alt.log('Персонаж успешно выбран, спавним игрока.');
    closeAllViews();
    showCursor(false); // Скрываем курсор
    alt.emit('spawnPlayer', position); // Спавним игрока на заданной позиции
});

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

// Обработчик получения списка персонажей с сервера и их отображение
alt.onServer('client:sendCharacterList', (characters) => {
    alt.log('Получен список персонажей от сервера');
    showCharacterSelection(characters); // Показ интерфейса выбора персонажа с доступными персонажами или создание нового
});

// Прослушивание событий для обновления и удаления имен через WebView
alt.on('updatePlayerName', (playerId, name, x, y, isPvp) => {
    alt.log(`Обновляем имя игрока: ${name}, координаты: X=${x}, Y=${y}`);
    view.emit('message', { type: 'updatePlayerName', playerId, name, x, y, isPvp });
});

alt.on('removePlayerName', (playerId) => {
    alt.log(`Удаляем имя игрока с ID: ${playerId}`);
    view.emit('message', { type: 'removePlayerName', playerId });
});

// Обработка события загрузки WebView для отображения имен
view.on('load', () => {
    alt.log('WebView для отображения имен загружен!');
});

alt.on('spawnPlayer', (position) => {
    alt.Player.local.pos = position;
    alt.log(`Игрок заспавнен на координатах: ${position.x}, ${position.y}, ${position.z}`);
});