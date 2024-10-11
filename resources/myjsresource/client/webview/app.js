const playerNamesContainer = document.getElementById('player-names');

// Проверка загрузки WebView
console.log('WebView загружен');

// Обновление позиции и имени игрока
function updatePlayerName(playerId, name, x, y, isPvp) {
    console.log(`Обновляем имя для игрока с ID: ${playerId}, имя: ${name}, координаты: ${x}, ${y}`);

    let nameElement = document.getElementById(`player-${playerId}`);
    if (!nameElement) {
        nameElement = document.createElement('div');
        nameElement.id = `player-${playerId}`;
        nameElement.className = 'nameTag';
        playerNamesContainer.appendChild(nameElement); // Добавляем элемент в контейнер #player-names
    }

    nameElement.style.left = `${x}px`;
    nameElement.style.top = `${y}px`;

    if (isPvp) {
        nameElement.classList.add('pvp-mode');
        nameElement.style.color = 'purple'; // Изменение цвета в режиме PVP
    } else {
        nameElement.classList.remove('pvp-mode');
        nameElement.style.color = 'white'; // Обычный цвет имени
    }

    nameElement.textContent = name;
}

// Удаление имени при отключении игрока
function removePlayerName(playerId) {
    console.log(`Удаление имени для игрока с ID: ${playerId}`);

    const nameElement = document.getElementById(`player-${playerId}`);
    if (nameElement) {
        nameElement.remove();
    }
}

// Получаем события от клиента через WebView
window.addEventListener('message', (event) => {
    const { type, playerId, name, x, y, isPvp } = event.data;
    
    if (type === 'updatePlayerName') {
        updatePlayerName(playerId, name, x, y, isPvp);
    }

    if (type === 'removePlayerName') {
        removePlayerName(playerId);
    }
});

// Отслеживание полученных данных (для отладки)
window.addEventListener('message', (event) => {
    console.log('Получено сообщение для отображения:', event.data);
});
window.addEventListener('message', (event) => {
    console.log('Получено сообщение:', event.data);
});
