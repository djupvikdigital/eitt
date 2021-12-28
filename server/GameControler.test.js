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
    controler.plusTwoInPlay = 0
    return controler
}

describe('GameControler', () => {
    it('allows connecting and reconnecting again', () => {
        const controler = setupControlerWithMocks()
        let socket = { id: Math.random() }
        let player = controler.connect(socket)
        const playerId = player.id
        controler.disconnect(socket.id)
        socket = { id: Math.random() }
        player = controler.connect(socket, playerId)
        expect(player.id).toBe(playerId)
        expect(player.socket.id).toBe(socket.id)
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

    it('deletes the player when leaving a room', () => {
        const controler = setupControlerWithMocks(0)
        let socket = { id: Math.random() }
        controler.connect(socket)
        expect(controler.players.length).toBe(1)
        controler.leave(socket.id)
        expect(controler.players.length).toBe(0)
    })

    it('sets and removes socket property on player', () => {
        const controler = setupControlerWithMocks()
        let socket = { id: Math.random() }
        let player = controler.connect(socket)
        expect(player.socket.id).toBe(socket.id)
        controler.disconnect(socket.id)
        expect(player.socket).toBe(null)
    })

    it('returns the player with the turn', () => {
        const controler = setupControlerWithMocks(2)
        const players = controler.players
        controler.turn = 1
        expect(controler.getPlayerWithTurn().id).toBe(players[1].id)
    })

    it('allows reconnecting while still having turn', () => {
        const controler = setupControlerWithMocks(2)
        const players = controler.players
        let socket = { id: Math.random() }
        controler.turn = 1
        controler.disconnect(players[1].socket.id)
        controler.connect(socket, players[1].id)
        expect(controler.getPlayerWithTurn().id).toBe(players[1].id)
    })

    it('switches turn when leaving, connecting again does not give you turn', () => {
        const controler = setupControlerWithMocks(2)
        const players = controler.players
        let socket = { id: Math.random() }
        controler.turn = 1
        controler.leave(players[1].socket.id)
        controler.connect(socket)
        expect(controler.getPlayerWithTurn().id).toBe(players[0].id)
    })

    it('switches turn to next player when leaving', () => {
        const controler = setupControlerWithMocks(3)
        const players = controler.players
        let id = players[2].id
        controler.turn = 1
        controler.leave(players[1].socket.id)
        expect(controler.getPlayerWithTurn().id).toBe(id)
    })

    it('switches turn to previous player when leaving and direction is reverse', () => {
        const controler = setupControlerWithMocks(3)
        const players = controler.players
        controler.turn = 1
        controler.turnRotation = -1
        controler.leave(players[1].socket.id)
        expect(controler.getPlayerWithTurn().id).toBe(players[0].id)
    })

    it('does not switch turn if a later player has the turn', () => {
        const controler = setupControlerWithMocks(3)
        const players = controler.players
        let id = players[2].id
        controler.turn = 2
        controler.leave(players[1].socket.id)
        expect(controler.getPlayerWithTurn().id).toBe(id)
    })

    it('sets plusFourInPlay to true', () => {
        const controler = setupControlerWithMocks()
        expect(controler.plusFourInPlay).toBe(false)
        controler.playCard({ value: '+4' })
        expect(controler.plusFourInPlay).toBe(true)
    })

    it('does not draw 4 two times after plusFourInPlay', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        controler.playCard({ value: '+4' })
        controler.drawCards(player)
        expect(player.cards.length).toBe(4)
        controler.drawCards(player)
        expect(player.cards.length).toBe(5)
    })

    it('allows round to continue while +2 is in play', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        controler.roundFinished = true
        controler.deck.playedCards = []
        controler.playCard({ value: '+2' })
        expect(controler.roundFinished).toBe(true)
        controler.drawCards(player)
        expect(player.cards.length).toBe(2)
        expect(controler.roundFinished).toBe(true)
    })

    it('disallows playing cards other than +2 while +2 is in play', () => {
        const controler = setupControlerWithMocks()
        const card = { color: 'blue', value: '+2' }
        controler.deck.playedCards = []
        controler.playCard(card)
        controler.playCard({ color: 'blue', value: '0' })
        expect(controler.deck.playedCards.pop()).toEqual(card)
    })

    it('allows playing cards other than +2 after +2 was in play', () => {
        const controler = setupControlerWithMocks()
        const card = { color: 'blue', value: '0' }
        controler.deck.playedCards = []
        controler.playCard({ color: 'blue', value: '+2' })
        controler.plusTwoInPlay = 0
        controler.playCard(card)
        expect(controler.deck.playedCards.pop()).toEqual(card)
    })

    it('disallows playing a card while +4 is in play', () => {
        const controler = setupControlerWithMocks()
        const card = { value: '+4' }
        controler.playCard(card)
        controler.playCard({ color: 'blue', value: '0' })
        expect(controler.deck.playedCards.pop()).toEqual(card)
    })

    it('allows playing a card after +4 was in play', () => {
        const controler = setupControlerWithMocks()
        const card = { color: 'blue', value: '0' }
        controler.playCard({ color: 'blue', value: '+4' })
        controler.plusFourInPlay = false
        controler.playCard(card)
        expect(controler.deck.playedCards.pop()).toEqual(card)
    })

    it('allows checking +4, giving 4 cards if color is found', () => {
        const controler = setupControlerWithMocks(2)
        const players = controler.players
        players[0].cards = [{ color: 'blue' }]
        controler.deck.playedCards = [{ color: 'blue' }]
        controler.playCard({ value: '+4' })
        controler.lastPlayerId = players[0].id
        controler.checkPlusFour(players[1])
        expect(players[0].cards.length).toEqual(5)
    })

    it('allows checking +4, giving 6 cards if color is not found', () => {
        const controler = setupControlerWithMocks(2)
        const players = controler.players
        players[0].cards = [{ color: 'blue' }]
        controler.deck.playedCards = [{ color: 'green' }]
        controler.playCard({ value: '+4' })
        controler.lastPlayerId = players[0].id
        controler.checkPlusFour(players[1])
        expect(players[1].cards.length).toEqual(6)
    })

    it('resets pressedEitt when drawing cards', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        player.pressedEitt = true
        controler.drawCards(player)
        expect(player.pressedEitt).toBe(false)
    })

    it('sets hasDrawn after regular drawing', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        controler.drawCards(player)
        expect(player.hasDrawn).toBe(true)
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

    it('disallows regular drawing unless player has turn', () => {
        const controler = setupControlerWithMocks(2)
        const player = controler.players[0]
        controler.turn = 1
        controler.drawCards(player)
        expect(player.cards.length).toBe(0)
        controler.turn = 0
        controler.drawCards(player)
        expect(player.cards.length).toBe(1)
    })

    it('disallows regular drawing if player already has drawn', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        player.hasDrawn = true
        controler.drawCards(player)
        expect(player.cards.length).toBe(0)
    })

    it('allows drawing specified number of cards outside turn', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        player.hasDrawn = true
        controler.drawCards(player, 2)
        expect(player.cards.length).toBe(2)
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

    it('draws 3 cards even when plusFourInPlay is true', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
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
        deck.availableCards.push({ value: 'R' })
        controler.addScoresForRound()
        controler.dealNewRound(deck)
        expect(controler.hasTurn(players[0])).toBe(true)
        expect(controler.hasTurn(players[1])).toBe(false)
        expect(controler.turnRotation).toBe(-1)
    })

    it('removes the card from the player when playing card from player', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        player.cards = [{ color: 'black', value: 'W' }]
        controler.playCardFromPlayer(player, 0)
        expect(player.cards.length).toBe(0)
    })

    it('does nothing when playing card with invalid index from player', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        player.cards = [{ color: 'black', value: 'W' }]
        controler.playCardFromPlayer(player, 1)
        expect(player.cards.length).toBe(1)
    })

    it('resets player.hasDrawn when playing card from player', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        player.cards = [{ color: 'black', value: 'W' }]
        player.hasDrawn = true
        controler.playCardFromPlayer(player, 0)
        expect(player.hasDrawn).toBe(false)
    })

    it('sets lastPlayerId when playing card from player', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        player.cards = [{ color: 'black', value: 'W' }]
        controler.playCardFromPlayer(player, 0)
        expect(controler.lastPlayerId).toBe(player.id)
    })

    it('sets roundFinished when playing last card from player', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        player.name = 'foo'
        player.cards = [{ color: 'black', value: '+4' }]
        controler.playCardFromPlayer(player, 0)
        expect(controler.roundFinished).toBe(true)
        expect(controler.roundWinner).toBe('foo')
    })

    it('disallows playing unless player has turn when playing card from player', () => {
        const controler = setupControlerWithMocks(2)
        const player = controler.players[0]
        controler.turn = 1
        player.cards = [{ color: 'black', value: 'W' }]
        controler.playCardFromPlayer(player, 0)
        expect(player.cards.length).toBe(1)
    })

    it('switches turn when playing card from player', () => {
        const controler = setupControlerWithMocks(2)
        const players = controler.players
        players[0].cards = [{ color: 'black', value: 'W' }, { color: 'black', value: 'W' }]
        controler.playCardFromPlayer(players[0], 0)
        expect(controler.hasTurn(players[0])).toBe(false)
        expect(controler.hasTurn(players[1])).toBe(true)
    })

    it('changes the card color when playing wildcard from player', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        player.cards = [{ color: 'black', value: 'W' }]
        controler.playCardFromPlayer(player, 0, 'blue')
        expect(controler.deck.playedCards.pop().color).toBe('blue')
    })

    it('does not change the card color if playing wildcard is not allowed', () => {
        const controler = setupControlerWithMocks()
        const player = controler.players[0]
        controler.plusFourInPlay = true
        player.cards = [{ color: 'black', value: 'W' }]
        controler.playCardFromPlayer(player, 0, 'blue')
        expect(player.cards[0].color).toBe('black')
    })
})