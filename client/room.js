let atLoginPage = true;

function createClickHandler(i, card) {
    return function clickHandler(event) {
        currentIndex = i;
        if (card.color === 'black') {
            showColorPicker();
            event.stopPropagation()
        }
        else {
            socket.emit('playCard', { index: i });
            console.log('playCard emitted, index = ' + i)
        }
    }
}

function getClassNameForCard(card) {
    return 'card card-' + card.color + ' card-' + card.color + '-' + card.value.replace('+', 'plus-')
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
        element.className = getClassNameForCard(card);
        element.textContent = card.value;
        fragment.appendChild(element);
    }
    cardsElement.appendChild(fragment);
}

function renderLastPlayedCard(card) {
    let lastPlayedCardElement = document.getElementById('last-played-card');
    lastPlayedCardElement.className = getClassNameForCard(card);
    lastPlayedCardElement.textContent = card.value;
}

function renderPlayerList(status) {
    let playerListELement = document.getElementById('player-list');
    playerListELement.textContent = '';
    let fragment = document.createDocumentFragment();
    for (let player of status.playerList) {
        let element = document.createElement('li');
        element.textContent = player.name + ', ' + player.numberOfCards;
        if (player.hasTurn) {
            element.style.fontWeight = 'bold';
        }
        if (player.pressedEitt) {
            element.style.color = 'red'
        }
        else if (player.id !== status.id) {
            let didntPressEittButton = document.createElement('button')
            didntPressEittButton.textContent = "Didn't press eitt"
            didntPressEittButton.addEventListener('click', function () {
                socket.emit('didntPressEitt', player.id)
            })
            element.appendChild(didntPressEittButton)
        }
        fragment.appendChild(element);
    }
    playerListELement.appendChild(fragment);
} 

function renderPlayerScores(playerList) {
    let playerScoresElement = document.getElementById('player-scores')
    playerScoresElement.textContent = ''
    let fragment = document.createDocumentFragment()
    let scores = []
    for (let i = 0; i < playerList.length; i++) {
        let player = playerList[i]
        let column = [player.name].concat(player.scores.reduce(function (array, score) {
            if (array.length > 0) {
                return array.concat(array[array.length - 1] + score)
            }
            else {
                return [score]
            }
        }, []))
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
    console.log('Gamestatus received:')
    console.log(status)
    gameStatus = status;
    document.getElementById('draw-card').textContent = 'Draw ' + status.drawCount
    renderCards(status.cards);
    renderPlayerList(status);
    document.getElementById('your-turn').style.visibility = status.hasTurn ? 'inherit' : 'hidden'
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
    /*
    if (inRoom == 'mainlobby') {
        document.getElementById("mainlobby").style.display = "block";
        document.getElementById("room").style.display = "none";
    }
    */
    if (inRoom != 'mainlobby' && inRoom != '' ) {
        document.getElementById("mainlobby").style.display = "none";
        document.getElementById("createNewRoomDiv").style.display = "none";
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
            element.className = 'joinButton';
            element.addEventListener('click', createClickHandlerJoinRoom(room.room));
            element.textContent = room.room
            divElement.appendChild(element)
        }
    }
    let element = document.createElement('button');
    element.className = 'createButton';
    element.addEventListener('click', function(){
        document.getElementById("mainlobby").style.display = "none";
        document.getElementById("createNewRoomDiv").style.display = "block";
    });
    element.textContent = 'Create a room';
    divElement.appendChild(element)

})
function createClickHandlerJoinRoom(room) {
    return function clickHandler() {
        socket.emit('joinRoom', room)
    }
}
document.getElementById("backToLobbyFromCreateRoom").addEventListener('click', function(){
    document.getElementById("mainlobby").style.display = "block";
    document.getElementById("createNewRoomDiv").style.display = "none";
});

socket.on('roundWinner', function(data){
    let divElement = document.getElementById('roundWinner')
    let h1 = document.createElement('h2')
    h1.textContent = 'The round winner is..... ' + data + '!!'
    divElement.appendChild(h1)
    changeButtonDisableState(true)
    let highestScore = 0
    let playerWithHightestScore = null
    let playerList = gameStatus.playerList
    for (let i = 0; i < playerList.length; i++) {
        let player = playerList[i]
        let score = player.scores[player.scores.length - 1]
        if (score >= highestScore) {
            highestScore = score
            playerWithHightestScore = player
        }
    }
    if (playerWithHightestScore.id === gameStatus.id) {
        document.getElementById('round-controls').style.visibility = 'inherit'
    }
})

socket.on('newRound', function(){
    let divElement = document.getElementById('roundWinner')
    divElement.textContent = ''
    changeButtonDisableState(false)
    document.getElementById('round-controls').style.visibility = ''
})

function changeButtonDisableState(state) {
    let buttonArray = document.getElementsByClassName('card')
    for (let i = 0; i < buttonArray.length; i++) {
        let button = buttonArray[i]
        button.disabled = state
    }
}

document.addEventListener('click', hideColorPicker)

document.getElementById('createNewRoomButton').addEventListener('click', function () {
    let newRoom = document.getElementById('newRoomNameInput').value;
    socket.emit('createNewRoom', newRoom);
})

function changeName() {
    let name = document.getElementById('change-name-input').value;
    socket.emit('nameChanged', name);
    document.getElementById("loginDiv").style.display = "none";
    document.getElementById("mainlobby").style.display = "block";
    atLoginPage = false;
}

document.getElementById('change-name-button').addEventListener('click', changeName);

document.addEventListener('keyup', logKeyUp);

function logKeyUp(e) {
    if (e.keyCode == 13 && atLoginPage) {
        changeName();
        console.log(e.keyCode)
    }
}

document.getElementById('draw-card').addEventListener('click', function () {
    socket.emit('drawCards');
});

document.getElementById('pass').addEventListener('click', function () {
    socket.emit('pass');
});

document.getElementById('eitt').addEventListener('click', function () {
    socket.emit('eitt')
})

document.getElementById('check-plus-four').addEventListener('click', function () {
    socket.emit('checkPlusFour')
})

document.getElementById('pick-blue').addEventListener('click', function () {
    socket.emit('playCard', { color: 'blue', index: currentIndex });
});

document.getElementById('pick-green').addEventListener('click', function () {
    socket.emit('playCard', { color: 'green', index: currentIndex });
});

document.getElementById('pick-red').addEventListener('click', function () {
    socket.emit('playCard', { color: 'red', index: currentIndex });
});

document.getElementById('pick-yellow').addEventListener('click', function () {
    socket.emit('playCard', { color: 'yellow', index: currentIndex });
});

document.getElementById('new-round').addEventListener('click', function () {
    socket.emit('newRound')
})