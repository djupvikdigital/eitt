import { CardDeck } from './CardDeck'
import { GameControler } from './GameControler'
import { Player } from './Player'

function noop() {
    return
}

function setupControlerWithMocks(numberOfPlayers = 1) {
    const controler = GameControler('', { 0: {}})
    let players = []
    for (let i = 0; i < numberOfPlayers; i++) {
        let player = Player()
        player.socket = { id: Math.random(), emit: noop }
        players.push(player)
    } 
    controler.players = players
    controler.startNeutral = true
    controler.dealNewRound()
    return controler
}

describe('GameControler', () => {
    it('resets player scores when starting new game', () => {
        const controler = setupControlerWithMocks()
        let player = controler.players[0]
        player.scores = [500]
        controler.startNewGame()
        expect(player.scores.length).toBe(0)
    })

    it('changes state from NOT_STARTED to PLAYING when dealing new round', () => {
        const controler = GameControler('', { 0: {}})
        let player = Player()
        player.socket = { id: Math.random(), emit: noop }
        controler.players = [player]
        expect(controler.state).toBe('NOT_STARTED')
        controler.dealNewRound()
        expect(controler.state).toBe('PLAYING')
    })

    it('disallows dealing new round while PLAYING', () => {
        const controler = setupControlerWithMocks()
        let player = controler.players[0]
        player.cards = []
        controler.dealNewRound()
        expect(player.cards.length).toBe(0)
    })

    it('disallows dealing new round while ROUND_FINISHING', () => {
        const controler = setupControlerWithMocks()
        let player = controler.players[0]
        player.cards = []
        controler.state = 'ROUND_FINISHING'
        controler.dealNewRound()
        expect(player.cards.length).toBe(0)
    })

    it('allows connecting and reconnecting again', () => {
        const controler = setupControlerWithMocks()
        let socket = { id: Math.random() }
        let player = controler.connect(socket)
        const playerId = player.id
        player.isPlaying = true
        controler.disconnect(socket.id)
        socket = { id: Math.random() }
        player = controler.connect(socket, playerId)
        expect(player.id).toBe(playerId)
        expect(player.socket.id).toBe(socket.id)
    })

    it('removes disconnecting player if player was not playing', () => {
        const controler = setupControlerWithMocks()
        let socket = { id: Math.random() }
        let player = controler.connect(socket)
        controler.disconnect(socket.id)
        expect(controler.players.length).toBe(1)
    })

    it('disallows connecting as an already connected player', () => {
        const controler = setupControlerWithMocks()
        let socket = { id: Math.random() }
        let player = controler.connect(socket)
        const playerId = player.id
        socket = { id: Math.random() }
        player = controler.connect(socket, playerId)
        expect(player.id).not.toBe(playerId)
        expect(player.socket.id).toBe(socket.id)
    })

    it('lets player wait when joining after round is started', () => {
        const controler = setupControlerWithMocks()
        let socket = { id: Math.random() }
        controler.dealNewRound()
        controler.connect(socket)
        expect(controler.players.length).toBe(2)
        expect(controler.getPlayingPlayers().length).toBe(1)
    })

    it('deletes the player when leaving a room', () => {
        const controler = setupControlerWithMocks()
        let socket = { id: Math.random() }
        controler.connect(socket)
        expect(controler.players.length).toBe(2)
        controler.leave(socket.id)
        expect(controler.players.length).toBe(1)
    })

    it('sets and removes socket property on player', () => {
        const controler = setupControlerWithMocks()
        let socket = { id: Math.random() }
        let player = controler.connect(socket)
        player.isPlaying = true
        expect(player.socket.id).toBe(socket.id)
        controler.disconnect(socket.id)
        expect(player.socket).toBe(null)
    })

    it('allows reconnecting while still having turn', () => {
        const controler = setupControlerWithMocks(2)
        const players = controler.players
        let socket = { id: Math.random() }
        controler.round.turn.playerIndex = 1
        controler.disconnect(players[1].socket.id)
        controler.connect(socket, players[1].id)
        expect(controler.getPlayerWithTurn().id).toBe(players[1].id)
    })

    it('switches turn when leaving, connecting again does not give you turn', () => {
        const controler = setupControlerWithMocks(2)
        const players = controler.players
        let socket = { id: Math.random() }
        controler.round.turn.playerIndex = 1
        controler.leave(players[1].socket.id)
        controler.connect(socket)
        expect(controler.getPlayerWithTurn().id).toBe(players[0].id)
    })

    it('switches turn to next player when leaving', () => {
        const controler = setupControlerWithMocks(3)
        const players = controler.players
        let id = players[2].id
        controler.round.turn.playerIndex = 1
        controler.leave(players[1].socket.id)
        expect(controler.getPlayerWithTurn().id).toBe(id)
    })

    it('switches turn to previous player when leaving and direction is reverse', () => {
        const controler = setupControlerWithMocks(3)
        const players = controler.players
        controler.round.turn.playerIndex = 1
        controler.turnRotation = -1
        controler.leave(players[1].socket.id)
        expect(controler.getPlayerWithTurn().id).toBe(players[0].id)
    })

    it('does not switch turn if a later player has the turn', () => {
        const controler = setupControlerWithMocks(3)
        const players = controler.players
        let id = players[2].id
        controler.round.turn.playerIndex = 2
        controler.leave(players[1].socket.id)
        expect(controler.getPlayerWithTurn().id).toBe(id)
    })

    it('reverts to NOT_STARTED state if all playing players are removed', () => {
        const controler = setupControlerWithMocks()
        let socket = { id: Math.random(), emit: noop }
        controler.connect(socket)
        controler.removePlayer(0)
        expect(controler.state).toBe('NOT_STARTED')
    })

    it('does not give turn to non-playing player', () => {
        const controler = setupControlerWithMocks(3)
        const players = controler.players
        players[2].isPlaying = false
        controler.round.turn.playerIndex = 1
        controler.turnSwitch()
        expect(controler.getPlayerWithTurn().id).toBe(players[0].id)
    })

    it('does not give turn to non-playing first player', () => {
        const controler = setupControlerWithMocks(3)
        const players = controler.players
        players[0].isPlaying = false
        controler.round.turn.playerIndex = 1
        controler.turnSwitch()
        expect(controler.getPlayerWithTurn().id).toBe(players[1].id)
    })

    it('starts with first playing player after dealer having turn', () => {
        const controler = setupControlerWithMocks(3)
        const players = controler.players
        players[1].isPlaying = false
        expect(controler.getPlayerWithTurn().id).toBe(players[2].id)
    })

    it('does not set hasDrawn when +2 or +4 in play', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        controler.plusTwoInPlay = 1
        controler.drawCards(player)
        expect(player.hasDrawn).toBe(false)
        controler.plusFourInPlay = true
        controler.drawCards(player)
        expect(player.hasDrawn).toBe(false)
    })

    it('does not set hasDrawn when drawing specified number of cards', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        controler.drawCards(player, 2)
        expect(player.hasDrawn).toBe(false)
    })

    it('correctly calculates scores for numbered cards', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        const cards = [
            { value: '0' },
            { value: '1' },
            { value: '2' },
            { value: '3' },
            { value: '4' },
            { value: '5' },
            { value: '6' },
            { value: '7' },
            { value: '8' },
            { value: '9' }
        ]
        player.cards = cards
        const scores = controler.calculateScores()
        expect(scores[player.id]).toBe(45)
    })

    it('correctly calculates scores for special cards', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        const cards = [
            { value: '+2' },
            { color: 'black', value: '+4' },
            { value: 'R' },
            { value: 'S' },
            { color: 'black', value: 'W' }
        ]
        player.cards = cards
        const scores = controler.calculateScores()
        expect(scores[player.id]).toBe(160)
    })

    it('adds scores to players for each round', () => {
        const controler = setupControlerWithMocks(2)
        const players = controler.players
        controler.addScoresForRound()
        expect(typeof players[0].scores[0]).toBe('number')
        controler.dealNewRound()
        controler.addScoresForRound()
        expect(typeof players[0].scores[1]).toBe('number')
    })

    it('does not add scores to non-playing players', () => {
        const controler = setupControlerWithMocks(2)
        const players = controler.players
        players[1].isPlaying = false
        controler.addScoresForRound()
        expect(typeof players[0].scores[0]).toBe('number')
        expect(typeof players[1].scores[0]).toBe('undefined')
    })

    it('pads scores array for player joining later in game', () => {
        const controler = setupControlerWithMocks(2)
        controler.addScoresForRound()
        let socket = { id: Math.random(), emit: noop }
        let player = controler.connect(socket)
        controler.state = 'ROUND_FINISHED'
        controler.dealNewRound()
        controler.addScoresForRound()
        expect(player.scores.length).toBe(2)
    })

    it('supports giving player joining later an average of player scores', () => {
        const controler = setupControlerWithMocks(4)
        const players = controler.players
        let socket = { id: Math.random(), emit: noop }
        for (let i = 0; i < players.length; i++) {
            players[i].scores = [Math.pow(i, 2), Math.pow(i, 3)]
        }
        controler.startScore = GameControler.START_SCORE_AVERAGE
        let player = controler.connect(socket)
        controler.state = 'ROUND_FINISHED'
        controler.dealNewRound()
        expect(player.scores[1]).toBe(13)
    })

    it('supports giving player joining later the median of player scores', () => {
        const controler = setupControlerWithMocks(4)
        const players = controler.players
        let socket = { id: Math.random(), emit: noop }
        for (let i = 0; i < players.length; i++) {
            players[i].scores = [Math.pow(i, 2), Math.pow(i, 3)]
        }
        controler.startScore = GameControler.START_SCORE_MEDIAN
        let player = controler.connect(socket)
        controler.state = 'ROUND_FINISHED'
        controler.dealNewRound()
        expect(player.scores[1]).toBe(7)
    })

    it('supports giving player joining later the lowest player score', () => {
        const controler = setupControlerWithMocks(4)
        const players = controler.players
        let socket = { id: Math.random(), emit: noop }
        for (let i = 0; i < players.length; i++) {
            players[i].scores = [Math.pow(i + 1, 2), Math.pow(i + 1, 3)]
        }
        controler.startScore = GameControler.START_SCORE_MIN
        let player = controler.connect(socket)
        controler.state = 'ROUND_FINISHED'
        controler.dealNewRound()
        expect(player.scores[1]).toBe(2)
    })

    it('supports giving player joining later the highest player score', () => {
        const controler = setupControlerWithMocks(4)
        const players = controler.players
        let socket = { id: Math.random(), emit: noop }
        for (let i = 0; i < players.length; i++) {
            players[i].scores = [Math.pow(i, 2), Math.pow(i, 3)]
        }
        controler.startScore = GameControler.START_SCORE_MAX
        let player = controler.connect(socket)
        controler.state = 'ROUND_FINISHED'
        controler.dealNewRound()
        expect(player.scores[1]).toBe(36)
    })

    it('supports letting player joining later start with 0 points', () => {
        const controler = setupControlerWithMocks(4)
        const players = controler.players
        let socket = { id: Math.random(), emit: noop }
        for (let i = 0; i < players.length; i++) {
            players[i].scores = [Math.pow(i + 1, 2), Math.pow(i + 1, 3)]
        }
        controler.startScore = GameControler.START_SCORE_ZERO
        let player = controler.connect(socket)
        controler.state = 'ROUND_FINISHED'
        controler.dealNewRound()
        expect(player.scores[1]).toBe(0)
    })

    it('removes disconnected players when dealing new round', () => {
        const controler = setupControlerWithMocks(3)
        const players = controler.players.slice(0)
        players[2].cards = []
        controler.disconnect(players[1].socket.id)
        controler.state = 'ROUND_FINISHED'
        controler.dealNewRound()
        expect(controler.players.length).toBe(2)
        expect(players[2].cards.length).toBe(7)
    })

    it('draws 3 cards even when plusFourInPlay is true', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        player.cards = []
        controler.plusFourInPlay = true
        controler.drawCards(player, 3)
        expect(player.cards.length).toBe(3)
    })

    it('starts with the dealer if first card is reverse', () => {
        const controler = setupControlerWithMocks(2)
        const players = controler.players
        players[0].cards = [{ value: '1' }]
        players[1].cards = []
        const deck = CardDeck()
        deck.availableCards[deck.availableCards.length - 15] = { value: 'R' }
        controler.state = 'ROUND_FINISHED'
        controler.addScoresForRound()
        controler.startNeutral = false
        controler.dealNewRound(deck)
        expect(controler.round.hasTurn(players[0])).toBe(true)
        expect(controler.round.hasTurn(players[1])).toBe(false)
        expect(controler.round.turnRotation).toBe(-1)
    })

    it('does not have playMulVal set if first card is reverse', () => {
        const controler = setupControlerWithMocks(2)
        const players = controler.players
        players[0].cards = [{ value: '1' }]
        players[1].cards = []
        const deck = CardDeck()
        deck.availableCards[deck.availableCards.length - 15] = { value: 'R' }
        controler.state = 'ROUND_FINISHED'
        controler.addScoresForRound()
        controler.playMultiple = true
        controler.startNeutral = false
        controler.dealNewRound(deck)
        expect(controler.playMulVal).toBe(null)
    })

    it('does not start with +4', () => {
        const controler = setupControlerWithMocks()
        const deck = CardDeck()
        deck.availableCards[deck.availableCards.length - 8] = { value: '+4' }
        controler.state = 'ROUND_FINISHED'
        controler.dealNewRound(deck)
        expect(deck.getLastPlayedCard().value).not.toBe('+4')
    })

    it('does not set plusTwoInPlay when starting neutral', () => {
        const controler = setupControlerWithMocks()
        const deck = CardDeck()
        deck.availableCards[deck.availableCards.length - 8] = { value: '+2' }
        controler.state = 'ROUND_FINISHED'
        controler.startNeutral = true
        controler.dealNewRound(deck)
        expect(controler.plusTwoInPlay).toBe(0)
    })

    it('starts normal if first card is reverse and starting neutral', () => {
        const controler = setupControlerWithMocks(2)
        const players = controler.players
        players[0].cards = [{ value: '1' }]
        players[1].cards = []
        const deck = CardDeck()
        deck.availableCards[deck.availableCards.length - 15] = { value: 'R' }
        controler.state = 'ROUND_FINISHED'
        controler.addScoresForRound()
        controler.startNeutral = true
        controler.dealNewRound(deck)
        expect(controler.hasTurn(players[0])).toBe(false)
        expect(controler.hasTurn(players[1])).toBe(true)
        expect(controler.turnRotation).toBe(1)
    })

    it('does not start with W when starting neutral', () => {
        const controler = setupControlerWithMocks()
        const deck = CardDeck()
        deck.availableCards[deck.availableCards.length - 8] = { value: 'W' }
        controler.state = 'ROUND_FINISHED'
        controler.startNeutral = true
        controler.dealNewRound(deck)
        expect(deck.getLastPlayedCard().value).not.toBe('W')
    })

    it('disallows pressing eitt outside of turn', () => {
        const controler = setupControlerWithMocks(2)
        const player = controler.players[0]
        player.cards = [{ value: 'W' }]
        controler.round.turn.playerIndex = 1
        controler.pressEitt(player)
        expect(player.pressedEitt).toBe(false)
    })

    it('doubles the amount of cards in deck if many players join', () => {
        const controler = setupControlerWithMocks(36)
        const players = controler.players
        const numberOfDealedCards = players.reduce(function (previousValue, currentPlayer) {
            return previousValue + currentPlayer.cards.length
        }, 0)
        expect(numberOfDealedCards).toBeGreaterThan(108)
    })
})