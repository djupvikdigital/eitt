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

function renderPlayerScores(playerList) {
    console.log(playerList)
    let playerScoresElement = document.getElementById('player-scores')
    playerScoresElement.textContent = ''
    let fragment = document.createDocumentFragment()
    let scores = []
    for (let i = 0; i < playerList.length; i++) {
        let player = playerList[i]
        let column = [player.name].concat(player.scores)
        for (let j = 0; j < column.length; j++) {
            if (scores[j]) {
                scores[j].push(column[j])
            }
            else {
                scores[j] = [column[j]]
            }
        }
    }
    for (let i = 0; i < scores.length; i++) {
        let rowElement = document.createElement('tr')
        for (let cell of scores[i]) {
            let cellElement = document.createElement(i === 0 ? 'th' : 'td')
            cellElement.textContent = cell
            rowElement.appendChild(cellElement)
        }
        fragment.appendChild(rowElement)
    }
    playerScoresElement.appendChild(fragment)
}

function setGameStatus(status) {
    gameStatus = status;
    renderCards(status.cards);
    renderPlayerList(status.playerList);
    renderPlayerScores(status.playerList)
    renderLastPlayedCard(status.lastPlayedCard)
}

function showColorPicker() {
    document.getElementById('color-picker').style.display = 'inline';
}

let currentIndex = 0;
let gameStatus = {};

var socket = io();

socket.on('gameStatus', setGameStatus);

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

socket.on('roundWinner', function(data){
    let divElement = document.getElementById('roundWinner')
    let h1 = document.createElement('h2')
    let h2 = document.createElement('h2')
    h1.textContent = 'The round winner is..... ' + data + '!!'
    h2.textContent = 'Starting new round in just a moment'
    divElement.appendChild(h1)
    divElement.appendChild(h2)
    changeButtonDisableState(true)
})

socket.on('newRound', function(){
    let divElement = document.getElementById('roundWinner')
    divElement.textContent = ''
    changeButtonDisableState(false)
})

function changeButtonDisableState(state) {
    let buttonArray = document.getElementsByClassName('card')
    for (let i = 0; i < buttonArray.length; i++) {
        let button = buttonArray[i]
        button.disabled = state
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
