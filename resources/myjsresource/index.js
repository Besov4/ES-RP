const alt = require('alt-server');

alt.log('Сервер запущен!');

alt.on('playerConnect', (player) => {
    alt.log(`${player.name} подключился к серверу.`);
    
    // Устанавливаем позицию спавна (координаты XYZ на карте)
    player.spawn(425.1, -979.5, 30.7);  // Пример: это центр карты в воздухе над землей

    // Можно добавить сет модели игрока
    player.model = 'mp_m_freemode_01';  // Задаем стандартную модель игрока
});

alt.on('chatMessage', (player, message) => {
    alt.emitClient(player, 'chat:addMessage', { args: [player.name, message] });
});