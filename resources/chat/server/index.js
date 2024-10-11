const alt = require('alt-server');
const { CHAT_MESSAGE_EVENT } = require('../shared/shared-server.js');

// Подключение к базе данных
const mysql = require('mysql2/promise');
const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Never0665338464ivaN',
    database: 'gta_rp_server'
});

let cmdHandlers = {};
let mutedPlayers = new Map();

// Функция проверки прав доступа по роли
function hasPermission(player, requiredRole) {
    const account = player.getMeta('account');
    alt.log(player.getMeta('account'));
    if (!account || !account.role) {
        return false;
    }

    const roles = {
        'user': 1,
        'moderator': 2,
        'admin': 3,
        'creator': 4
    };

    return roles[account.role] >= roles[requiredRole];
}

// Функция обработки команд
function invokeCmd(player, cmd, args) {
    cmd = cmd.toLowerCase();
    const callback = cmdHandlers[cmd];

    if (callback) {
        callback(player, args);
    } else {
        send(player, `{FF0000} Неизвестная команда /${cmd}`);
    }
}

// Обработка сообщений чата и команд
alt.onClient(CHAT_MESSAGE_EVENT, (player, msg) => {
    if (msg[0] === "/") {
        msg = msg.trim().slice(1);

        if (msg.length > 0) {
            alt.log("[chat:cmd] " + player.name + ": /" + msg);

            let args = msg.split(" ");
            let cmd = args.shift();

            invokeCmd(player, cmd, args);
        }
    } else {
        if (mutedPlayers.has(player) && mutedPlayers.get(player)) {
            send(player, "{FF0000} Вы находитесь в муте.");
            return;
        }

        msg = msg.trim();

        if (msg.length > 0) {
            alt.log("[chat:msg] " + player.name + ": " + msg);

            // Отправляем сообщение всем клиентам
            alt.emitAllClients(CHAT_MESSAGE_EVENT, player.name, msg);
        }
    }
});

// Отправка сообщений игроку
function send(player, msg) {
    if (!player) {
        alt.logError("[chat.send] Параметр player не должен быть null, используйте broadcast.");
        return;
    }
    alt.emitClient(player, CHAT_MESSAGE_EVENT, null, msg);
}

// Широковещательная рассылка сообщений
function broadcast(msg) {
    alt.emitAllClients(CHAT_MESSAGE_EVENT, null, msg);
}

// Регистрация команды
function registerCmd(cmd, callback) {
    cmd = cmd.toLowerCase();

    if (cmdHandlers[cmd] !== undefined) {
        alt.logError(`Не удалось зарегистрировать команду /${cmd}, уже зарегистрирована.`);
    } else {
        cmdHandlers[cmd] = callback;
    }
}

// Команда регистрации
registerCmd('register', async (player, args) => {
    alt.log("Команда /register вызвана с аргументами: " + JSON.stringify(args));

    if (args.length < 7) {
        send(player, 'Используйте команду: /register <имя> <фамилия> <email> <пароль> <discordId> <rockstarId>');
        return;
    }

    const [firstName, lastName, email, password, discordId, rockstarId] = args;

    alt.log(`Попытка регистрации: ${firstName} ${lastName}, ${email}, ${password}, ${discordId}, ${rockstarId}`);

    const result = await registerPlayer(firstName, lastName, email, password, discordId, rockstarId);

    if (result.success) {
        alt.log("Регистрация успешна для " + email);
        send(player, 'Регистрация прошла успешно. Войдите в игру.');
    } else {
        alt.log("Регистрация не удалась: " + result.message);
        send(player, result.message);
    }
});

// Функция регистрации в базе данных
async function registerPlayer(firstName, lastName, email, password, discordId, rockstarId) {
    try {
        const [rows] = await connection.execute('SELECT * FROM accounts WHERE email = ?', [email]);
        if (rows.length > 0) {
            return { success: false, message: 'Email уже зарегистрирован.' };
        }

        await connection.execute(
            'INSERT INTO accounts (firstName, lastName, email, password_hash, discord_id, rockstar_id, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [firstName, lastName, email, password, discordId, rockstarId, 'user']
        );

        alt.log('Регистрация прошла успешно для пользователя: ' + email);
        return { success: true };
    } catch (error) {
        alt.logError("Ошибка при регистрации: " + error.message);
        return { success: false, message: 'Ошибка регистрации.' };
    }
}

// команда логина игрока
registerCmd('login', async (player, args) => {
    alt.log("Команда /login вызвана с аргументами: " + JSON.stringify(args));

    if (args.length < 2) {
        send(player, 'Используйте команду: /login <email> <пароль>');
        return;
    }

    const [email, password] = args;

    alt.log(`Попытка авторизации: ${email}`);

    try {
        const result = await loginPlayer(email, password);

        if (result.success) {
            alt.log("Авторизация успешна для " + email);
            send(player, 'Авторизация прошла успешно. Добро пожаловать в игру.');
            player.setMeta('account', result.account);  // Привязка аккаунта к игроку
            player.setMeta('knownPlayers', []);  // Инициализация списка знакомых
        } else {
            alt.log("Авторизация не удалась: " + result.message);
            send(player, result.message);
        }
    } catch (error) {
        alt.logError("Ошибка авторизации: " + error.message);
        send(player, 'Ошибка авторизации.');
    }
});

// Функция для авторизации игрока
async function loginPlayer(email, password) {
    try {
        const [rows] = await connection.execute('SELECT * FROM accounts WHERE email = ? AND password_hash = ?', [email, password]);
        if (rows.length === 0) {
            return { success: false, message: 'Неверный email или пароль.' };
        }

        return { success: true, account: rows[0] };
    } catch (error) {
        alt.logError("Ошибка при авторизации: " + error.message);
        return { success: false, message: 'Ошибка авторизации.' };
    }
}

// Команда изменения роли игрока
registerCmd('setrole', async (player, args) => {
    if (!hasPermission(player, 'creator')) {
        send(player, 'У вас недостаточно прав.');
        return;
    }

    const targetName = args[0];
    const newRole = args[1];
    const validRoles = ['user', 'moderator', 'admin', 'creator'];

    if (!validRoles.includes(newRole)) {
        send(player, 'Неверная роль.');
        return;
    }

    const targetPlayer = alt.Player.all.find(p => p.name === targetName);
    if (targetPlayer) {
        await connection.execute('UPDATE accounts SET role = ? WHERE username = ?', [newRole, targetPlayer.name]);
        targetPlayer.setMeta('account', { ...targetPlayer.getMeta('account'), role: newRole });
        send(player, `Роль игрока ${targetName} изменена на ${newRole}.`);
        send(targetPlayer, `Ваша роль изменена на ${newRole}.`);
    } else {
        send(player, `Игрок с именем ${targetName} не найден.`);
    }
});

// Экспортируем функции
module.exports = {
    send,
    broadcast,
    registerCmd
};
