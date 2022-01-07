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
    if (card) {
        lastPlayedCardElement.className = getClassNameForCard(card);
        lastPlayedCardElement.textContent = card.value;
    }
    else {
        lastPlayedCardElement.className = 'card';
        lastPlayedCardElement.textContent = '';
    }
    return true
}

function renderPlayerList(status) {
    let playerListELement = document.getElementById('player-list');
    playerListELement.textContent = '';
    let fragment = document.createDocumentFragment();
    let ns = 'http://www.w3.org/2000/svg'
    for (let i = 0; i < status.playerList.length; i++) {
        let player = status.playerList[i];
        console.log(player);
        //create avatar
        let SVGavatar = document.getElementById('SVGavatar').cloneNode(true);
        SVGavatar.removeAttribute('id');
        let SVG = document.createElementNS(ns, 'svg');
        let masterSVG = document.getElementById('masterSVG');
        SVG.setAttribute('version', masterSVG.getAttribute('version'));
        SVG.setAttribute('width', '100%');
        SVG.setAttribute('height', '100%');
        SVG.setAttribute('style', masterSVG.getAttribute('style'));
        SVG.setAttribute('viewBox', masterSVG.getAttribute('viewBox'));
        let group = document.createElementNS(ns, 'g');
        let masterGroup = document.getElementById('masterGroup');
        group.setAttribute('transform', masterGroup.getAttribute('transform'));
        SVGupdateClass(status.playerList[i].style.body, '.avatarBody', SVGavatar);
        SVGupdateClass(status.playerList[i].style.head, '.avatarHead', SVGavatar);
        let li = document.createElement('li')
        let details = document.createElement('details')
        let summary = document.createElement('summary')
        let title = document.createElement('div');
        let avatar = document.createElement('div');
        let box = document.createElement('div')
        let dl = document.createElement('dl')
        box.className = 'details-body'
        details.className = 'player'
        summary.className = 'player-summary'
        title.textContent = player.name;
        let dt = document.createElement('dt')
        dt.textContent = 'Status'
        dl.appendChild(dt)
        let dd = document.createElement('dd')
        dd.textContent = player.connected ? (player.isPlaying ? 'Playing' : 'Waiting') : 'Not connected'
        dl.appendChild(dd)
        box.appendChild(dl);
        if (player.hasTurn) {
            title.style.fontWeight = 'bold';
            let SVGavatarGlow = document.getElementById('SVGavatarGlow').cloneNode(true);
            SVGavatarGlow.removeAttribute('id');
            SVGavatarGlow.style.visibility = '';
            SVG.appendChild(SVGavatarGlow);
        }
        if (player.pressedEitt) {
            title.style.color = 'red'
        }
        if (!player.connected) {
            let button = document.createElement('button')
            button.textContent = 'Remove'
            button.addEventListener('click', function () {
                socket.emit('removePlayer', i)
            })
            box.appendChild(button);
        }
        else if (i === status.index && status.cards.length <= 2 && status.cards.length > 0) {
            let button = document.createElement('button')
            button.textContent = 'Eitt'
            button.addEventListener('click', function () {
                socket.emit('eitt')
            })
            box.appendChild(button);
        }
        else if (player.numberOfCards === 1 && player.pressedEitt === false) {
            let button = document.createElement('button')
            button.textContent = "Didn't press eitt"
            button.addEventListener('click', function () {
                socket.emit('didntPressEitt', i)
            })
            box.appendChild(button);
        }
        group.appendChild(SVGavatar);
        if (player.style.headGear > 0) {
            let SVGheadGear = document.getElementById('SVGheadGear' + player.style.headGear).cloneNode(true);
            SVGheadGear.removeAttribute('id');
            SVGheadGear.style.visibility = '';
            group.appendChild(SVGheadGear);
        }
        SVG.appendChild(group);
        for(let i = 0; i < player.numberOfCards; i++) {
            document.getElementById('loginDiv').style.display = 'block'
            let length = document.getElementById('SVGavatar').getBoundingClientRect().width
            let cardLength = document.getElementById('SVGcardBackside').getBoundingClientRect().width
            if (!atLoginPage) document.getElementById('loginDiv').style.display = 'none'
            let cardDist = 5;
            let cardSVG = document.getElementById('SVGcardBackside').cloneNode(true);
            cardSVG.removeAttribute('id');
            cardSVG.style.visibility = '';
            let cardX = length / 2 + cardDist * i - cardDist * player.numberOfCards / 2 - cardLength / 4;
            let cardY = 140;
            cardSVG.setAttribute('transform', 'translate(' + cardX + ', ' + cardY + ') scale(0.1)')
            SVG.appendChild(cardSVG);
        }
        avatar.appendChild(SVG);
        summary.appendChild(avatar);
        summary.appendChild(title);
        details.appendChild(summary);
        details.appendChild(box);
        li.appendChild(details);
        fragment.appendChild(li);
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
    if (status.state === 'NOT_STARTED') {
        if (status.index === 0) {
            // First player gets to set game options
            document.getElementById('game-options').style.display = 'block'
        }
        else {
            document.getElementById('game-options').style.display = ''
        }
    }
    else if (status.state === 'PLAYING') {
        let divElement = document.getElementById('roundWinner')
        divElement.textContent = ''
        changeButtonDisableState(false)
        // Hide game options and show game table when game is started
        document.getElementById('game-options').style.display = ''
        document.getElementById('game-table').style.display = 'block'
        document.getElementById('round-controls').style.visibility = ''
    }
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

let inRoom = sessionStorage.getItem('room') || ''
let storedPlayerSettings = sessionStorage.getItem('playerSettings')
if (storedPlayerSettings) {
    let playerSettings = JSON.parse(storedPlayerSettings)
    socket.emit('nameChanged', playerSettings)
    document.getElementById('change-name-input').value = playerSettings.name
}
if (inRoom) {
    atLoginPage = false
    socket.emit('joinRoom', { playerId: sessionStorage.getItem('playerId'), room: inRoom })
}
socket.on('joinRoom', function(data){
    inRoom = data.room
    /*
    if (inRoom == 'mainlobby') {
        document.getElementById("mainlobby").style.display = "block";
        document.getElementById("room").style.display = "none";
    }
    */
    if (inRoom != 'mainlobby' && inRoom != '' ) {
        document.getElementById("loginDiv").style.display = "none";
        document.getElementById("mainlobby").style.display = "none";
        document.getElementById("room").style.display = "block";
        document.getElementById("roomNameHeadline").textContent = 'Room: ' + data.room
    }
    sessionStorage.setItem('playerId', data.playerId)
    sessionStorage.setItem('room', data.room)
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
})
function createClickHandlerJoinRoom(room) {
    return function clickHandler() {
        socket.emit('joinRoom', { room: room })
    }
}
function backToLobby() {
    document.getElementById("mainlobby").style.display = "block";
    document.getElementById("room").style.display = "none";
    document.getElementById('loginDiv').style.display = 'none'
}

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
    if (gameStatus.hasTurn) {
        document.getElementById('round-controls').style.visibility = 'inherit'
    }
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
    let pack = {};
    pack.name = document.getElementById('change-name-input').value;
    pack.body = document.getElementById('avatarBodySelector').dataset.currentColor;
    pack.head = document.getElementById('avatarHeadSelector').dataset.currentColor;
    pack.headGear = selectedHeadGear;
    socket.emit('nameChanged', pack);
    sessionStorage.setItem('playerSettings', JSON.stringify(pack));
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

document.getElementById('leave-room').addEventListener('click', function () {
    socket.emit('joinRoom', { room: 'mainlobby' })
    backToLobby()
})

document.getElementById('start-game').addEventListener('click', function () {
    socket.emit('newRound')
})

document.getElementById('draw-card').addEventListener('click', function () {
    socket.emit('drawCards');
});

document.getElementById('pass').addEventListener('click', function () {
    socket.emit('pass');
});

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

function SVGupdateClass(picker, selector, node) {
    let inClass = node.querySelectorAll(selector);
    console.log(picker.toString());
    for (let i = 0; i < inClass.length; i++) {
        inClass[i].style.fill = picker;
    }
}

let SVGheadGear = document.querySelectorAll(".SVGheadGear")
let selectedHeadGear = 0;

function swithSVGheadGear() {
    for (let i = 0; i < SVGheadGear.length; i++) {
        SVGheadGear[i].style.visibility = 'hidden';
    }
    if (selectedHeadGear > 0) {
        document.getElementById('SVGheadGear' + selectedHeadGear).style.visibility = '';
    }
}

document.getElementById('headGearSelectLeft').addEventListener('click', function () {
    selectedHeadGear--;
    if (selectedHeadGear < 0) selectedHeadGear = SVGheadGear.length;
    swithSVGheadGear();
})

document.getElementById('headGearSelectRight').addEventListener('click', function () {
    selectedHeadGear++;
    if (selectedHeadGear > SVGheadGear.length) selectedHeadGear = 0;
    swithSVGheadGear();
})

document.addEventListener('click', function (e) {
    // Close open player details when clicking outside them
    let playerDetailsElements = document.getElementsByClassName('player')
    for (let i = 0; i < playerDetailsElements.length; i++) {
        let element = playerDetailsElements[i]
        if (!element.contains(e.target)) {
            element.removeAttribute('open')
        }
    }
})

jscolor.trigger('input change');