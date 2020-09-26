import { generateCard } from '/client/game.js';

function addCard(card) {
    cards.push(card)
    renderCards(cards);
}

function createClickHandler(i, card, cards) {
    return function clickHandler() {
        cards.splice(i, 1);
        renderCards(cards);
        socket.emit('playCard', card);
    }
}

function renderCards(cards) {
    let cardsElement = document.getElementById('cards');
    cardsElement.textContent = '';
    let fragment = document.createDocumentFragment();
    for (let i = 0; i < cards.length; i++) {
        let card = cards[i];
        let element = document.createElement('button');
        element.addEventListener('click', createClickHandler(i, card, cards));
        element.className = 'card';
        element.style.backgroundColor = card.color;
        element.textContent = card.value;
        fragment.appendChild(element);
    }
    cardsElement.appendChild(fragment);
}

function renderLastPlayedCard(card) {
    let lastPlayedCardElement = document.getElementById('last-played-card');
    lastPlayedCardElement.style.backgroundColor = card.color;
    lastPlayedCardElement.textContent = card.value;
}

let cards = [];
for (let i = 0; i < 7; i++) {
    cards.push(generateCard());
}

console.log(cards);

renderCards(cards);

var socket = io();

socket.on('lastPlayed', renderLastPlayedCard);

socket.on('unlegitPlay', addCard);

document.getElementById('draw-card').addEventListener('click', function () {
    addCard(generateCard());
});