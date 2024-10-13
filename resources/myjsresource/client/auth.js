import * as alt from 'alt-client';
import { showCursor } from './cursor.js';

export const authView = new alt.WebView('file:///C:/altv-server/resources/myjsresource/client/webview/auth.html');

let isLoginInProgress = false;

authView.on('load', () => {
    alt.log('WebView загружен!');
    showCursor(true);
    authView.focus();
    authView.emit('show');
});

authView.on('client:register', (name, email, password, discordId) => {
    if (isLoginInProgress) return;
    isLoginInProgress = true;
    alt.log(`Попытка регистрации: имя=${name}, email=${email}`);
    alt.emitServer('client:register', name, email, password, discordId);
});

authView.on('client:login', (email, password) => {
    if (isLoginInProgress) return;
    isLoginInProgress = true;
    alt.log(`Попытка логина: email=${email}`);
    alt.emitServer('client:login', email, password);
});

alt.onServer('client:loginError', (errorMessage) => {
    alt.log(`Ошибка авторизации: ${errorMessage}`);
    isLoginInProgress = false;
    authView.emit('showError', errorMessage);
});

export function closeAuthView() {
    if (authView) {
        authView.unfocus();
        authView.emit('hide');
        showCursor(false);
        isLoginInProgress = false;
    }
}
