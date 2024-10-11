const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'your_password', // Замени на пароль своей базы данных
    database: 'gta_rp_server'
};

async function registerPlayer(username, email, password, discordId, rockstarId) {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM accounts WHERE email = ? OR username = ?', [email, username]);

        if (rows.length > 0) {
            return { success: false, message: 'Аккаунт с таким email или именем пользователя уже существует.' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.execute(
            'INSERT INTO accounts (username, email, password_hash, discord_id, rockstar_id) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, discordId, rockstarId]
        );

        return { success: true, message: 'Аккаунт успешно создан.' };
    } catch (err) {
        console.error(err);
        return { success: false, message: 'Ошибка сервера при регистрации.' };
    }
}

async function loginPlayer(email, password) {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM accounts WHERE email = ?', [email]);

        if (rows.length === 0) {
            return { success: false, message: 'Аккаунт не найден.' };
        }

        const account = rows[0];
        const match = await bcrypt.compare(password, account.password_hash);

        if (!match) {
            return { success: false, message: 'Неверный пароль.' };
        }

        return { success: true, account };
    } catch (err) {
        console.error(err);
        return { success: false, message: 'Ошибка сервера при авторизации.' };
    }
}

module.exports = {
    registerPlayer,
    loginPlayer
};
