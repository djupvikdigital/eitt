import { getClassNameForCard, renderLastPlayedCards } from "./render.js";

function setTransformTimeout(element, transform, time) {
    setTimeout(function () {
        element.style.transform = transform;
    }, time);
}

export function animatePlayedCardsFrom(index, gameStatus) {
    let lastPlayedCards = gameStatus.lastPlayedCards;
    let playerElement = document.getElementsByClassName('player')[index];
    let animatedElements = [];
    for (let i = 0; i < lastPlayedCards.length; i++) {
        animatedElements[i] = document.createElement('span');
        let animatedElement = animatedElements[i];
        document.body.appendChild(animatedElement);
        let lastPlayedElement = document.getElementById('last-played-cards').children[0];
        let lastPlayedElementRect = lastPlayedElement.getBoundingClientRect();
        let playerElementRect = playerElement.getBoundingClientRect();
        let offsetLeft = (lastPlayedElementRect.left - playerElementRect.left);
        let offsetTop = (lastPlayedElementRect.top - playerElementRect.top);
        let transform = 'translateX(' + offsetLeft + 'px) translateY(' + offsetTop + 'px)';
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
    let cardsElement = document.getElementById('cards');
    let cardElement = null
    for (let i = 0; i < playedCards.length; i++) {
        cardElement = cardsElement.children[playedCards[i]];
        let lastPlayedElement = document.getElementById('last-played-cards').children[0];
        let cardElementRect = cardElement.getBoundingClientRect();
        let lastPlayedElementRect = lastPlayedElement.getBoundingClientRect();
        let offsetLeft = (cardElementRect.left - lastPlayedElementRect.left) * -1;
        let offsetTop = (cardElementRect.top - lastPlayedElementRect.top) * -1;
        let transform = 'translateX(' + offsetLeft + 'px) translateY(' + offsetTop + 'px)';
        setTransformTimeout(cardElement, transform, i * 100);
    }
    cardElement.addEventListener('transitionend', callback);
}
