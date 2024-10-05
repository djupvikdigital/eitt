export function createTransitionEndHandler(i) {
    return function transitionEndHandler() {
        renderCards(gameStatus.cards, gameStatus.cardsToPlay);
        renderLastPlayedCard(gameStatus.lastPlayedCard)
    }
}

function showColorPicker() {
    document.getElementById('color-picker').style.display = 'inline';
}

function addCardToPlay(index, color, socket) {
    let data = { index: index };
    if (color) {
        data.color = color;
    }
    socket.emit('addCardToPlay', data);
}

function removeCardFromPlay(index, socket) {
    let data = { index: index };
    socket.emit('removeCardFromPlay', data);
}

export function createClickHandler(i, card, toPlay, currentIndex, socket) {
    return function clickHandler(event) {
        currentIndex = i;
        if (card.color === 'black' && gameStatus.cards.length > 1) {
            showColorPicker();
            event.stopPropagation()
        }
        else if (toPlay) {
            removeCardFromPlay(i, socket)
            console.log('removeCardFromPlay emitted, index = ' + i)
        }
        else {
            addCardToPlay(i, null, socket)
            console.log('addCardToPlay emitted, index = ' + i)
        }
    }
}

export function createPickers(socket) {
    document.getElementById('pick-blue').addEventListener('click', function () {
        addCardToPlay(currentIndex, 'blue', socket);
    });
    
    document.getElementById('pick-green').addEventListener('click', function () {
        addCardToPlay(currentIndex, 'green', socket);
    });
    
    document.getElementById('pick-red').addEventListener('click', function () {
        addCardToPlay(currentIndex, 'red', socket);
    });
    
    document.getElementById('pick-yellow').addEventListener('click', function () {
        addCardToPlay(currentIndex, 'yellow', socket);
    });
}