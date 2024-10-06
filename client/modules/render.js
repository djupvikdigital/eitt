const OPEN_WHEN_ROUND_FINISHED = 0;
const OPEN_ALWAYS = 1;
const OPEN_NEVER = 2;
let openPlayerScores = OPEN_WHEN_ROUND_FINISHED;

import { createTransitionEndHandler, createClickHandler } from "./handlers.js";

export function SVGupdateClass(picker, selector, node) {
    let inClass = node.querySelectorAll(selector);
    for (let i = 0; i < inClass.length; i++) {
        inClass[i].style.fill = picker;
    }
}

export function getClassNameForCard(card, toPlay) {
    return 'card ' + (toPlay ? 'card-to-play ' : '') + 'card-' + card.color + ' card-' + card.color + '-' + card.value.replace('+', 'plus-')
}

export function renderCards(cards, cardsToPlay = [], currentIndex, socket, gameStatus) {
    let cardsElement = document.getElementById('cards');
    cardsElement.textContent = '';
    let fragment = document.createDocumentFragment();
    for (let i = 0; i < cards.length; i++) {
        let card = cards[i];
        let toPlay = cardsToPlay.includes(i);
        let element = document.createElement('button');
        element.addEventListener('click', createClickHandler(i, card, toPlay, currentIndex, socket, gameStatus));
        element.addEventListener('transitionend', createTransitionEndHandler(i))
        element.className = getClassNameForCard(card, toPlay);
        element.textContent = card.value;
        if (toPlay) {
            let number = document.createElement('h1')
            number.className = 'number'
            number.textContent = cardsToPlay.indexOf(i) + 1
            element.appendChild(number)
        }
        fragment.appendChild(element);
    }
    cardsElement.appendChild(fragment);
}

export function renderLastPlayedCard(card) {
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

export function renderPlayerList(status, atLoginPage, socket) {
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
        else if (!player.pressedEitt) {
            let numberOfCards = player.numberOfCards
            if (i === status.index && numberOfCards <= 2 && numberOfCards > 0) {
                let button = document.createElement('button')
                button.textContent = 'Eitt'
                button.addEventListener('click', function () {
                    socket.emit('eitt')
                })
                box.appendChild(button);
            }
            else if (numberOfCards === 1) {
                let button = document.createElement('button')
                button.textContent = "Didn't press eitt"
                button.addEventListener('click', function () {
                    socket.emit('didntPressEitt', i)
                })
                box.appendChild(button);
            }
        }
        group.appendChild(SVGavatar);
        if (player.style.headGear > 0) {
            let SVGheadGear = document.getElementById('SVGheadGear' + player.style.headGear).cloneNode(true);
            SVGheadGear.removeAttribute('id');
            SVGheadGear.style.visibility = '';
            group.appendChild(SVGheadGear);
        }
        SVG.appendChild(group);
        for (let i = 0; i < player.numberOfCards; i++) {
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

export function renderPlayerScores(status) {
    let playerList = status.playerList
    let playerScoresElement = document.getElementById('player-scores')
    playerScoresElement.textContent = ''
    let details = document.createElement('details')
    let summary = document.createElement('summary')
    let table = document.createElement('table')
    if (openPlayerScores === OPEN_ALWAYS || (status.state === 'ROUND_FINISHED' && openPlayerScores === OPEN_WHEN_ROUND_FINISHED)) {
        details.open = true
    }
    details.addEventListener('toggle', function () {
        if (status.state === 'ROUND_FINISHED') {
            openPlayerScores = details.open ? OPEN_WHEN_ROUND_FINISHED : OPEN_NEVER
        }
        else {
            openPlayerScores = details.open ? OPEN_ALWAYS : OPEN_WHEN_ROUND_FINISHED
        }
    })
    summary.textContent = 'Player scores'
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
        table.appendChild(rowElement)
    }
    details.appendChild(summary)
    details.appendChild(table)
    playerScoresElement.appendChild(details)
}