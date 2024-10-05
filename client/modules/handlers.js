export function createTransitionEndHandler(i) {
    return function transitionEndHandler() {
        renderCards(gameStatus.cards, gameStatus.cardsToPlay);
        renderLastPlayedCard(gameStatus.lastPlayedCard)
    }
}

function showColorPicker() {
    document.getElementById('color-picker').style.display = 'inline';
    document.getElementById('play').style.display = 'none';
}

function hideColorPicker() {
    document.getElementById('color-picker').style.display = 'none';
} 

function addCardToPlay(index, socket) {
    let data = { index: index };
    socket.emit('addCardToPlay', data);
}

function removeCardFromPlay(index, socket) {
    let data = { index: index };
    socket.emit('removeCardFromPlay', data);
}

function playTurn(color, socket) {
    let data = {}
    if (color) {
        data.color = color;
    }
    socket.emit('playTurn', data);
}

export function createClickHandler(i, card, toPlay, currentIndex, socket) {
    return function clickHandler(event) {
        currentIndex = i;
        if (card.color === 'black' && gameStatus.cards.length > 1) {
            showColorPicker();
            event.stopPropagation()
        }
        if (toPlay) {
            removeCardFromPlay(i, socket)
            hideColorPicker()
            console.log('removeCardFromPlay emitted, index = ' + i)
        }
        else {
            addCardToPlay(i, socket)
            console.log('addCardToPlay emitted, index = ' + i)
        }
    }
}

export function createPickers(socket) {
    document.getElementById('pick-blue').addEventListener('click', function () {
        playTurn('blue', socket);
    });
    
    document.getElementById('pick-green').addEventListener('click', function () {
        playTurn('green', socket);
    });
    
    document.getElementById('pick-red').addEventListener('click', function () {
        playTurn('red', socket);
    });
    
    document.getElementById('pick-yellow').addEventListener('click', function () {
        playTurn('yellow', socket);
    });
}