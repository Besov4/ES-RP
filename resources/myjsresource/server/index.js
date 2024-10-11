const alt = require('alt-server');
const { CHAT_MESSAGE_EVENT } = require('../shared/index.js');
const mysql = require('mysql2/promise');
const fs = require('fs');

// Подключение к базе данных
const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Never0665338464ivaN',
    database: 'gta_rp_server'
});

// Команды и чат
let cmdHandlers = {};
let mutedPlayers = new Map();

// Функция генерации динамического ID
function generateDynamicID() {
    return Math.floor(Math.random() * 3000);
}

// Логирование ID
function logDynamicIDAssignment(player, dynamicID) {
    const account = player.getMeta('account');

    if (!account || !account.id) {
        alt.logError("Метаданные 'account' не найдены для игрока или отсутствует 'id'.");
        return;
    }

    const staticID = account.id;
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] Static ID: ${staticID}, Dynamic ID: ${dynamicID} assigned\n`;

    // Логируем в консоль и файл
    alt.log(logEntry);
    fs.appendFileSync('dynamicIdLogs.txt', logEntry);
}

// Функция для логирования удаления ID
function logDynamicIDRemoval(player) {
    const account = player.getMeta('account');

    if (!account || !account.id) {
        alt.logError("Метаданные 'account' не найдены для игрока или отсутствует 'id'.");
        return;
    }

    const dynamicID = player.getMeta('dynamicID');
    const staticID = account.id;
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] Static ID: ${staticID}, Dynamic ID: ${dynamicID} removed\n`;

    alt.log(logEntry);
    fs.appendFileSync('dynamicIdLogs.txt', logEntry);
}

// Спавн игрока
function spawnPlayer(player, position) {
    const spawnPosition = position || { x: 0, y: 0, z: 100 }; // Пример координат
    alt.emitClient(player, 'spawnPlayer', spawnPosition);
}

// Событие при подключении игрока
alt.on('playerConnect', (player) => {
    const dynamicID = generateDynamicID();
    player.setMeta('dynamicID', dynamicID);

    // Логирование, чтобы убедиться, что событие отправляется
    alt.log(`Игрок подключен: ${player.name}, отправляем showAuthUI`);

    // Отправляем игроку событие для показа интерфейса авторизации/регистрации
    alt.emitClient(player, 'showAuthUI');
});

// Обработка событий регистрации от клиента
alt.onClient('client:register', async (player, name, email, password, discordId) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM accounts WHERE email = ?', [email]);

        if (rows.length > 0) {
            alt.emitClient(player, 'client:loginError', 'Этот email уже зарегистрирован.');
            return;
        }

        await connection.execute('INSERT INTO accounts (username, email, password_hash, discord_id, role, available_slots) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, password, discordId, 'user', 1]
        );

        alt.emitClient(player, 'client:loginError', 'Регистрация успешна! Теперь войдите в аккаунт.');
    } catch (err) {
        alt.emitClient(player, 'client:loginError', 'Ошибка регистрации.');
        console.error(err);
    }
});

// Обработка событий авторизации от клиента
alt.onClient('client:login', async (player, email, password) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM accounts WHERE email = ? AND password_hash = ?', [email, password]);

        if (rows.length === 0) {
            alt.emitClient(player, 'client:loginError', 'Неверный email или пароль.');
            return;
        }

        // Успешный вход
        alt.log(`Авторизация успешна для игрока: ${player.name}`);
        player.setMeta('account', rows[0]);

        // Получение списка персонажей для аккаунта
        const [characters] = await connection.execute('SELECT id, character_name, model FROM characters WHERE account_id = ?', [rows[0].id]);

        if (characters.length === 0) {
            alt.emitClient(player, 'client:sendCharacterList', []); // Отправляем пустой список персонажей, чтобы показать создание нового
        } else {
            alt.emitClient(player, 'client:sendCharacterList', characters); // Отправляем список доступных персонажей
        }
    } catch (err) {
        alt.emitClient(player, 'client:loginError', 'Ошибка авторизации.');
        console.error(err);
    }
});

// Обработка создания персонажа
alt.onClient('server:createCharacter', async (player, name, surname, model) => {
    try {
        if (!name || !surname || !model) {
            alt.emitClient(player, 'client:createCharacterError', 'Ошибка: имя, фамилия или модель не определены.');
            return;
        }

        alt.log(`Создание персонажа: ${name} ${surname} для игрока ${player.name}`);

        const accountId = player.getMeta('account').id;

        // Проверяем количество уже существующих персонажей для данного аккаунта
        const [rows] = await connection.execute('SELECT COUNT(*) as characterCount FROM characters WHERE account_id = ?', [accountId]);
        const characterCount = rows[0].characterCount;

        // Ограничение на максимальное количество персонажей (1 бесплатный и 2 платных)
        const [accountRows] = await connection.execute('SELECT available_slots FROM accounts WHERE id = ?', [accountId]);
        const availableSlots = accountRows[0].available_slots;

        if (characterCount >= availableSlots) {
            alt.emitClient(player, 'client:createCharacterError', 'Максимальное количество персонажей уже создано.');
            return;
        }

        // Создаем нового персонажа
        await connection.execute(
            'INSERT INTO characters (account_id, character_name, character_surname, model) VALUES (?, ?, ?, ?)',
            [accountId, name, surname, model]
        );

        alt.emitClient(player, 'client:characterCreated', `${name} ${surname}`);
        alt.log(`Персонаж ${name} ${surname} успешно создан для игрока ${player.name}`);
    } catch (err) {
        alt.emitClient(player, 'client:createCharacterError', 'Ошибка создания персонажа.');
        console.error(err);
    }
});

// Обработка выбора персонажа
alt.onClient('server:selectCharacter', async (player, characterId) => {
    try {
        if (!characterId) {
            alt.emitClient(player, 'client:characterSelectError', 'Ошибка: characterId не определен.');
            return;
        }

        const accountId = player.getMeta('account').id;

        // Проверяем, принадлежит ли персонаж данному аккаунту
        const [rows] = await connection.execute('SELECT * FROM characters WHERE id = ? AND account_id = ?', [characterId, accountId]);

        if (rows.length === 0) {
            alt.emitClient(player, 'client:characterSelectError', 'Персонаж не найден или не принадлежит этому аккаунту.');
            return;
        }

        alt.emitClient(player, 'client:characterSelected', { x: 0, y: 0, z: 100 }); // Спавн на заданной позиции
        alt.log(`Персонаж ${rows[0].character_name} успешно выбран для игрока ${player.name}`);
    } catch (err) {
        alt.emitClient(player, 'client:characterSelectError', 'Ошибка выбора персонажа.');
        console.error(err);
    }
});

// Экспортируем функции для чата
module.exports.broadcast = function (msg) {
    alt.emitAllClients(CHAT_MESSAGE_EVENT, null, msg);
}

module.exports.mutePlayer = function (player, state) {
    mutedPlayers.set(player, state);
}