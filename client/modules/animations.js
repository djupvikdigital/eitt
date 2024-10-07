import { getClassNameForCard, renderLastPlayedCard } from "./render.js";

export function animateLastPlayedCardFrom(index, gameStatus) {
    let lastPlayedCard = gameStatus.lastPlayedCard;
    let playerElement = document.getElementsByClassName('player')[index];
    let animatedElement = document.createElement('div');
    document.body.appendChild(animatedElement);
    let lastPlayedElement = document.getElementById('last-played-card');
    let lastPlayedElementRect = lastPlayedElement.getBoundingClientRect();
    let playerElementRect = playerElement.getBoundingClientRect();
    let offsetLeft = (lastPlayedElementRect.left - playerElementRect.left);
    let offsetTop = (lastPlayedElementRect.top - playerElementRect.top);
    let transform = 'translateX(' + offsetLeft + 'px) translateY(' + offsetTop + 'px)';
    animatedElement.className = getClassNameForCard(lastPlayedCard);
    animatedElement.style.position = 'absolute';
    animatedElement.style.left = playerElementRect.left + 70 + 'px';
    animatedElement.style.top = playerElementRect.top + window.scrollY + 'px';
    animatedElement.addEventListener('transitionend', function() {
        document.body.removeChild(animatedElement);
        renderLastPlayedCard(lastPlayedCard);
    })
    animatedElement.style.transform = transform;
}

export function animatePlayCard(index) {
    let cardsElement = document.getElementById('cards');
    let cardElement = cardsElement.children[index];
    let lastPlayedElement = document.getElementById('last-played-card');
    let cardElementRect = cardElement.getBoundingClientRect();
    let lastPlayedElementRect = lastPlayedElement.getBoundingClientRect();
    let offsetLeft = (cardElementRect.left - lastPlayedElementRect.left) * -1;
    let offsetTop = (cardElementRect.top - lastPlayedElementRect.top) * -1;
    let transform = 'translateX(' + offsetLeft + 'px) translateY(' + offsetTop + 'px)';
    cardElement.style.transform = transform;
}
