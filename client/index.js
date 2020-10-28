function createClickHandler(i) {
    return function clickHandler() {
        socket.emit('playCard', i);
    }
}

function renderCards(cards) {
    let cardsElement = document.getElementById('cards');
    cardsElement.textContent = '';
    let fragment = document.createDocumentFragment();
    for (let i = 0; i < cards.length; i++) {
        let card = cards[i];
        let element = document.createElement('button');
        element.addEventListener('click', createClickHandler(i));
        element.className = 'card card-' + card.color;
        element.textContent = card.value;
        fragment.appendChild(element);
    }
    cardsElement.appendChild(fragment);
}

function renderLastPlayedCard(card) {
    let lastPlayedCardElement = document.getElementById('last-played-card');
    lastPlayedCardElement.className = 'card card-' + card.color;
    lastPlayedCardElement.textContent = card.value;
}

function renderPlayerList(playerList) {
    let playerListELement = document.getElementById('player-list');
    playerListELement.textContent = '';
    let fragment = document.createDocumentFragment();
    for (let player of playerList) {
        let element = document.createElement('li');
        element.textContent = player.name + ', ' + player.numberOfCards;
        if (player.hasTurn) {
            element.style.fontWeight = 'bold';
        }
        fragment.appendChild(element);
    }
    playerListELement.appendChild(fragment);
} 

function setGameStatus(status) {
    gameStatus = status;
    renderCards(status.cards);
    renderPlayerList(status.playerList);
}

let gameStatus = {};

var socket = io();

socket.on('gameStatus', setGameStatus);

socket.on('lastPlayed', renderLastPlayedCard);

document.getElementById('change-name-button').addEventListener('click', function () {
    let name = document.getElementById('change-name-input').value;
    socket.emit('nameChanged', name);
})

document.getElementById('draw-card').addEventListener('click', function () {
    socket.emit('drawCards', 1);
});