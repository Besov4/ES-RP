// Подключение к HTML-элементам
const nameInput = document.getElementById('character-name');
const surnameInput = document.getElementById('character-surname');
const createButton = document.getElementById('create-character-btn');
const errorContainer = document.getElementById('error-container');

// Событие для кнопки создания персонажа
createButton.addEventListener('click', () => {
    // Получаем данные из формы
    const name = nameInput.value.trim();
    const surname = surnameInput.value.trim();
    const selectedModel = document.querySelector('.character-model.selected');

    if (!selectedModel) {
        showError('Пожалуйста, выберите модель персонажа.');
        return;
    }

    const model = selectedModel.getAttribute('data-model-id');

    // Проверяем, что все поля заполнены
    if (!name || !surname) {
        showError('Пожалуйста, заполните все поля для создания персонажа.');
        return;
    }

    // Отправляем данные на сервер через alt:V
    alt.emit('client:createCharacter', name, surname, model);
});

// Функция для отображения ошибок
function showError(message) {
    errorContainer.innerText = message;
    errorContainer.style.display = 'block';
}

// Слушаем события от клиента alt:V
alt.on('showCreateCharacter', () => {
    // Показываем интерфейс создания персонажа
    document.getElementById('create-character-container').style.display = 'block';
});

alt.on('hideCreateCharacter', () => {
    // Скрываем интерфейс создания персонажа
    document.getElementById('create-character-container').style.display = 'none';
});

alt.on('showError', (message) => {
    // Отображаем сообщение об ошибке
    showError(message);
});

// Событие для выбора модели персонажа
document.querySelectorAll('.character-model').forEach((modelElement) => {
    modelElement.addEventListener('click', () => {
        // Снимаем выделение с других моделей
        document.querySelectorAll('.character-model').forEach((el) => el.classList.remove('selected'));
        // Выделяем выбранную модель
        modelElement.classList.add('selected');
    });
});
