import * as alt from 'alt-client';
import { showCursor } from './cursor.js';
import { closeAuthView } from './auth.js';

export const characterView = new alt.WebView('file:///C:/altv-server/resources/myjsresource/client/webview/character.html');
export const createCharacterView = new alt.WebView('file:///C:/altv-server/resources/myjsresource/client/webview/createCharacter.html');

let currentCharacterId = null;

export function showCharacterSelection(characters) {
    closeAuthView();

    if (!characters || characters.length === 0) {
        alt.log('Список персонажей пуст, показываем интерфейс создания персонажа.');
        createCharacterView.focus();
        createCharacterView.emit('showCreateCharacter');
        showCursor(true);
        return;
    }

    characterView.focus();
    characterView.emit('showCharacterSelection', characters);
    showCursor(true);
    alt.log('Показ интерфейса выбора персонажа');
}

createCharacterView.on('client:createCharacter', (name, surname, model) => {
    if (!name || !surname || !model) {
        alt.logError('Ошибка: имя, фамилия или модель не определены.');
        createCharacterView.emit('showError', 'Пожалуйста, заполните все поля.');
        return;
    }
    alt.log(`Запрос на создание нового персонажа: ${name} ${surname}`);
    alt.emitServer('server:createCharacter', name, surname, model);
});

characterView.on('client:selectCharacter', (characterId) => {
    alt.log(`Запрос на выбор персонажа с ID: ${characterId}`);
    if (characterId === undefined || characterId === null) {
        alt.logError('Ошибка: characterId не определен.');
        return;
    }
    currentCharacterId = characterId;
    alt.emitServer('server:selectCharacter', characterId);
});

alt.onServer('client:characterCreated', (characterName, position) => {
    alt.log(`Персонаж ${characterName} успешно создан.`);
    createCharacterView.emit('hide');
    showCursor(false);
    alt.emit('spawnPlayer', position);
});

alt.onServer('client:characterSelected', (position) => {
    alt.log('Персонаж успешно выбран, спавним игрока.');
    characterView.emit('hide');
    showCursor(false);
    alt.emit('spawnPlayer', position);
});
