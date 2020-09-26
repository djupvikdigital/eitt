function createClickHandler(card) {
    return function clickHandler() {
        socket.emit('playCard', card);
    }
}

function renderCards(cards) {
    let cardsElement = document.getElementById('cards');
    let fragment = document.createDocumentFragment();
    for (card of cards) {
        let element = document.createElement('button');
        element.addEventListener('click', createClickHandler(card));
        element.textContent = JSON.stringify(card);
        fragment.appendChild(element);
    }
    cardsElement.appendChild(fragment);
}

let cards = [{ color: 'red', value: 'S' }, { color: 'green', value: '+2' }];

renderCards(cards);

var socket = io();
