function createClickHandler(i, card) {
    return function clickHandler() {
        currentIndex = i;
        if (card.color === 'black') {
            showColorPicker();
        }
        else {
            socket.emit('playCard', { index: i });
        }
    }
}

function hideColorPicker() {
    document.getElementById('color-picker').style.display = 'none';
}

function renderCards(cards) {
    let cardsElement = document.getElementById('cards');
    cardsElement.textContent = '';
    let fragment = document.createDocumentFragment();
    for (let i = 0; i < cards.length; i++) {
        let card = cards[i];
        let element = document.createElement('button');
        element.addEventListener('click', createClickHandler(i, card));
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

function showColorPicker() {
    document.getElementById('color-picker').style.display = 'inline';
}

let currentIndex = 0;
let gameStatus = {};

var socket = io();

socket.on('gameStatus', setGameStatus);

socket.on('lastPlayed', renderLastPlayedCard);

let inRoom = ''
socket.on('joinRoom', function(data){
    inRoom = data
    if (inRoom == 'mainlobby') {
        document.getElementById("mainlobby").style.display = "block";
        document.getElementById("room").style.display = "none";
    }
    if (inRoom != 'mainlobby' && inRoom != '' ) {
        document.getElementById("mainlobby").style.display = "none";
        document.getElementById("room").style.display = "block";
        document.getElementById("roomNameHeadline").textContent = 'Room: ' + data
    }
})
socket.on('roomExists', function(){
    alert('Sorry, this room already exists, please be more creative and find another name!')
})
socket.on('roomStatus', function(data){
    let divElement = document.getElementById('openRooms')
    divElement.textContent = ''
    for (let i = 0; i < data.length; i++) {
        let room = data[i]
        if (room.room != 'mainlobby') {
            let element = document.createElement('button');
            element.addEventListener('click', createClickHandlerJoinRoom(room.room));
            element.textContent = room.room
            divElement.appendChild(element)
        }
    }
    if (data.length == 1) {
        let p = document.createElement('p')
        p.textContent = 'Sorry, no rooms seem to be open, but you can create one yourself?!'
        divElement.appendChild(p)
    }
})
function createClickHandlerJoinRoom(room) {
    return function clickHandler() {
        socket.emit('joinRoom', room)
    }
}

document.getElementById('createNewRoomButton').addEventListener('click', function () {
    let newRoom = document.getElementById('newRoomNameInput').value;
    socket.emit('createNewRoom', newRoom);
})

document.getElementById('change-name-button').addEventListener('click', function () {
    let name = document.getElementById('change-name-input').value;
    socket.emit('nameChanged', name);
})

document.getElementById('draw-card').addEventListener('click', function () {
    socket.emit('drawCards');
});

document.getElementById('pass').addEventListener('click', function () {
    socket.emit('pass');
});

document.getElementById('pick-blue').addEventListener('click', function () {
    hideColorPicker();
    socket.emit('playCard', { color: 'blue', index: currentIndex });
});

document.getElementById('pick-green').addEventListener('click', function () {
    hideColorPicker();
    socket.emit('playCard', { color: 'green', index: currentIndex });
});

document.getElementById('pick-red').addEventListener('click', function () {
    hideColorPicker();
    socket.emit('playCard', { color: 'red', index: currentIndex });
});

document.getElementById('pick-yellow').addEventListener('click', function () {
    hideColorPicker();
    socket.emit('playCard', { color: 'yellow', index: currentIndex });
});
