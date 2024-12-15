import { getClassNameForCard, renderLastPlayedCards } from "./render.js";

function setTransformTimeout(element, transform, time) {
    setTimeout(function () {
        element.style.transform = transform;
    }, time);
}

export function animateDrawCards(number, callback) {
    let drawCardElement = document.getElementById('draw-card');
    let drawCardElementRect = drawCardElement.getBoundingClientRect();
    let cardsElement = document.getElementById('cards');
    let cardElement = null
    let animatedElements = [];
    for (let i = 0; i < number; i++) {
        let animatedElement = document.createElement('span');
        animatedElements[i] = animatedElement;
        document.body.appendChild(animatedElement);
        animatedElement.className = 'card';
        animatedElement.style.position = 'absolute';
        animatedElement.style.left = drawCardElementRect.left + 70 + 'px';
        animatedElement.style.top = drawCardElementRect.top + window.scrollY + 'px';
        cardElement = cardsElement.children[cardsElement.children.length - 1];
        let cardElementRect = cardElement.getBoundingClientRect();
        let offsetLeft = (cardElementRect.left + 70 - drawCardElementRect.left);
        let offsetTop = (cardElementRect.top - drawCardElementRect.top);
        let transform = 'translateX(' + offsetLeft + 'px) translateY(' + offsetTop + 'px)';
        setTransformTimeout(animatedElement, transform, i * 100);
    }
    animatedElements[animatedElements.length - 1].addEventListener('transitionend', function() {
        for (let i = 0; i < animatedElements.length; i++) {
            document.body.removeChild(animatedElements[i]);
        }
        callback();
    })
}

export function animateDrawCardsTo(index, number, callback) {
    let playerElement = document.getElementsByClassName('player')[index];
    let playerElementRect = playerElement.getBoundingClientRect();
    let drawCardElement = document.getElementById('draw-card');
    let drawCardElementRect = drawCardElement.getBoundingClientRect();
    let offsetLeft = playerElementRect.left + playerElementRect.width / 2 - drawCardElementRect.left - drawCardElementRect.width / 2;
    let offsetTop = playerElementRect.top + playerElementRect.height / 2 - drawCardElementRect.top - drawCardElementRect.height / 2;
    let transform = 'translateX(' + offsetLeft + 'px) translateY(' + offsetTop + 'px) scale(0.2)';
    let animatedElements = [];
    for (let i = 0; i < number; i++) {
        let animatedElement = document.createElement('span');
        let elementText = document.createElement('div')
        animatedElements[i] = animatedElement;
        animatedElement.appendChild(elementText);
        document.body.appendChild(animatedElement);
        animatedElement.className = 'card';
        elementText.textContent = 'Eitt!'
        elementText.style.transform = 'rotate(-90deg) translate(120px)'
        elementText.style.color = 'white'
        elementText.style.fontFamily = 'monospace'
        elementText.style.fontSize = '50px'
        elementText.style.fontWeight = 'bold'
        animatedElement.style.transform = 'rotate(-90deg)'
        animatedElement.style.position = 'absolute';
        animatedElement.style.left = drawCardElementRect.left + 70 + 'px';
        animatedElement.style.top = drawCardElementRect.top + window.scrollY + 'px';
        setTransformTimeout(animatedElement, transform, i * 100);
    }
    animatedElements[animatedElements.length - 1].addEventListener('transitionend', function() {
        for (let i = 0; i < animatedElements.length; i++) {
            document.body.removeChild(animatedElements[i]);
        }
        callback();
    })

}

export function animatePlayedCardsFrom(index, gameStatus) {
    let lastPlayedCards = gameStatus.lastPlayedCards;
    let playerElement = document.getElementsByClassName('player')[index];
    let lastPlayedElement = document.getElementById('last-played-cards').children[0];
    let lastPlayedElementRect = lastPlayedElement.getBoundingClientRect();
    let playerElementRect = playerElement.getBoundingClientRect();
    let offsetLeft = (lastPlayedElementRect.left - playerElementRect.left);
    let offsetTop = (lastPlayedElementRect.top - playerElementRect.top);
    let transform = 'translateX(' + offsetLeft + 'px) translateY(' + offsetTop + 'px)';
    let animatedElements = [];
    for (let i = 0; i < lastPlayedCards.length; i++) {
        animatedElements[i] = document.createElement('span');
        let animatedElement = animatedElements[i];
        document.body.appendChild(animatedElement);
        animatedElement.className = getClassNameForCard(lastPlayedCards[i]);
        animatedElement.style.position = 'absolute';
        animatedElement.style.left = playerElementRect.left + 70 + 'px';
        animatedElement.style.top = playerElementRect.top + window.scrollY + 'px';
        setTransformTimeout(animatedElement, transform, i * 100);
    }
    animatedElements[animatedElements.length - 1].addEventListener('transitionend', function() {
        for (let i = 0; i < animatedElements.length; i++) {
            document.body.removeChild(animatedElements[i]);
        }
        renderLastPlayedCards(lastPlayedCards);
    })
}

export function animatePlayCards(playedCards, callback) {
    console.log('playedCards = ' + playedCards)
    let lastPlayedElement = document.getElementById('last-played-cards').children[0];
    let lastPlayedElementRect = lastPlayedElement.getBoundingClientRect();
    let cardsElement = document.getElementById('cards');
    let cardElement = null
    for (let i = 0; i < playedCards.length; i++) {
        cardElement = cardsElement.children[playedCards[i]];
        let cardElementRect = cardElement.getBoundingClientRect();
        let offsetLeft = (cardElementRect.left - lastPlayedElementRect.left) * -1;
        let offsetTop = (cardElementRect.top - lastPlayedElementRect.top) * -1;
        let transform = 'translateX(' + offsetLeft + 'px) translateY(' + offsetTop + 'px)';
        setTransformTimeout(cardElement, transform, i * 100);
    }
    cardElement.addEventListener('transitionend', callback);
}
