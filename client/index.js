import { addEventListeners, hideColorPicker} from "./modules/handlers.js";
import { renderCards, renderLastPlayedCard, renderPlayerList, renderPlayerScores, SVGupdateClass, getClassNameForCard } from "./modules/render.js";

document.getElementById('avatarHeadSelector').addEventListener('input', function(){SVGupdateClass(this.value, '.avatarHead', document)} )
document.getElementById('avatarBodySelector').addEventListener('input', function(){SVGupdateClass(this.value, '.avatarBody', document)} )

let atLoginPage = true;

let playCount = 0;

function animateLastPlayedCardFrom(index) {
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
    animatedElement.style.position = 'fixed';
    animatedElement.style.left = playerElementRect.left + 70 + 'px';
    animatedElement.style.top = playerElementRect.top + 'px';
    animatedElement.addEventListener('transitionend', function() {
        document.body.removeChild(animatedElement);
        renderLastPlayedCard(lastPlayedCard);
    })
    animatedElement.style.transform = transform;
}

function animatePlayCard(index) {
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

function setGameStatus(status) {
    let currentScroll = window.scrollY
    console.log('Gamestatus received:')
    console.log(status)
    let animatePlayFrom = -1
    if (gameStatus.lastPlayerIndex !== status.lastPlayerIndex) {
        animatePlayFrom = status.lastPlayerIndex
    }
    gameStatus = status;
    let playBlack = status.cardsToPlay.length && status.cards[status.cardsToPlay[0]].color === 'black';
    let showPlay = status.playMultiple && status.hasTurn && status.cardsToPlay.length && !playBlack;
    console.log('playBlack = ' + playBlack)
    if (status.state === 'NOT_STARTED') {
        if (status.index === 0) {
            // First player gets to set game options
            document.getElementById('game-options').style.display = 'block'
            document.getElementById('podium').style.display = ''
        }
        else {
            document.getElementById('game-options').style.display = ''
        }
        document.getElementById('game-table').style.display = ''
    }
    else if (status.state === 'PLAYING' || status.state === 'ROUND_FINISHING') {
        let divElement = document.getElementById('roundWinner')
        divElement.textContent = ''
        changeButtonDisableState(false)
        document.getElementById('game-options').style.display = ''
        document.getElementById('game-table').style.display = 'block'
        document.getElementById('play').style.display = showPlay ? 'inline-block' : ''
        document.getElementById('pass').style.display = status.canPass ? 'inline-block' : ''
        document.getElementById('check-plus-four').style.display = status.plusFourInPlay && status.hasTurn ? 'inline-block' : ''
        document.getElementById('round-controls').style.display = ''
    }
    else if (status.state === 'ROUND_FINISHED') {
        let roundWinnerElement = document.getElementById('roundWinner')
        roundWinnerElement.textContent = 'The round winner is..... ' + status.roundWinner + '!!'
        changeButtonDisableState(true)    
        document.getElementById('game-options').style.display = ''
        document.getElementById('game-table').style.display = 'block'
        if (status.hasTurn) {
            document.getElementById('round-controls').style.display = 'block'
        }
        else {
            document.getElementById('round-controls').style.display = ''
        }
    }
    else if (status.state == 'FINISHED') {
        document.getElementById('room').style.display = 'none'
        document.getElementById('podium').style.display = 'block'
        let winnerList = []
        for (let i = 0; i < status.playerList.length; i++) {
            let player = status.playerList[i]
            let winner = {}
            winner.name = player.name
            winner.style = player.style
            winner.score = 0
            for (let j = 0; j < player.scores.length; j++) {
                winner.score += player.scores[j]
            }
            winnerList.push(winner)
        }
        winnerList = winnerList.sort(function(a,b){return a.score - b.score})
        for (let i = 0; i < 3; i++) {
            if (i < winnerList.length) {
                document.getElementById('textx' + i).innerHTML = winnerList[i].name + ' - ' + winnerList[i].score
                SVGupdateClassPod(winnerList[i].style.body, '.avatarBodyx' + i)
                SVGupdateClassPod(winnerList[i].style.head, '.avatarHeadx' + i)
                document.getElementById('SVGavatarHGx' + i).innerHTML = ''
                if (winnerList[i].style.headGear > 0) {
                    let SVGheadGear = document.getElementById('SVGheadGear' + winnerList[i].style.headGear).cloneNode(true);
                    SVGheadGear.removeAttribute('id');
                    SVGheadGear.style.visibility = '';
                    document.getElementById('SVGavatarHGx' + i).appendChild(SVGheadGear);
                }
            } else {
                document.getElementById('SVGavatarx' + i).innerHTML = ''
            }
        }
    }
    document.getElementById('draw-card').textContent = 'Draw ' + status.drawCount
    if (playCount !== status.playCount) {
        playCount = status.playCount
        animatePlayCard(status.lastPlayedIndex)
    }
    else if (animatePlayFrom !== -1) {
        renderCards(status.cards, status.cardsToPlay, currentIndex, socket, gameStatus)
        console.log('animatePlayFrom = ', animatePlayFrom)
        animateLastPlayedCardFrom(animatePlayFrom)
    }
    else {
        renderCards(status.cards, status.cardsToPlay, currentIndex, socket, gameStatus);
        renderLastPlayedCard(status.lastPlayedCard)
    }
    renderPlayerList(status, atLoginPage);
    document.getElementById('your-turn').style.visibility = status.hasTurn ? 'inherit' : 'hidden'
    renderPlayerScores(status)
    window.scroll({top: currentScroll})
}

function SVGupdateClassPod(color, selector) {
    let inClass = document.querySelectorAll(selector);
    for (let i = 0; i < inClass.length; i++) {
        inClass[i].style.fill = color;
    }
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
}
socket.on('connect', function () {
    let storedRoom = sessionStorage.getItem('room')
    if (storedRoom) {
        socket.emit('joinRoom', { playerId: sessionStorage.getItem('playerId'), room: storedRoom })
    }
})
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
        sessionStorage.setItem('playerId', data.playerId)
    }
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
        if (room.room != 'mainlobby' && room.state != 'FINISHED') {
            let element = document.createElement('button');
            element.className = 'joinButton';
            element.addEventListener('click', createClickHandlerJoinRoom(room.room));
            element.textContent = room.room
            divElement.appendChild(element)
        }
    }
})
socket.on('userMessage', function(message) {
    document.getElementById('user-message-text').textContent = message
    document.getElementById('user-message').style.visibility = 'visible'
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
    document.getElementById('podium').style.display = 'none'
}

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
    pack.body = document.getElementById('avatarBodySelector').value;
    pack.head = document.getElementById('avatarHeadSelector').value;
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

document.getElementById('leave-room-2').addEventListener('click', function () {
    socket.emit('joinRoom', { room: 'mainlobby' })
    backToLobby()
})


let gameOptionsForm = document.getElementById('game-options')
gameOptionsForm.addEventListener('submit', function (e) {
    let data = new FormData(gameOptionsForm)
    data.append('playerId', gameStatus.id)
    socket.emit('startGame', Object.fromEntries(data))
    e.preventDefault()
})

addEventListeners(socket)

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

document.getElementById('user-message-close').addEventListener('click', function() {
    document.getElementById('user-message').style.visibility = ''
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
