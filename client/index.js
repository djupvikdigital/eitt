function renderCards(cards) {
    let cardsElement = document.getElementById('cards');
    let cardElements = cards.map(card => {
        let element = document.createElement('button');
        element.nodeValue = JSON.stringify(card)
    })
    let fragment = document.createDocumentFragment();
    for (element in cardElements) {
        fragment.appendChild(element);
    }
    document.appendChild(fragment);
}

let cards = [{ color: 'red', value: 'S' }, { color: 'green', value: '+2' }];

renderCards(cards);
