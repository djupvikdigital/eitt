import { Player } from './Player'
import { Round } from './Round'

describe('Round', () => {
    it('can play a turn', () => {
        let card = { color: 'blue', value: 1 }
        let round = Round()
        let player = Player()
        player.cards = [card]
        round.players = [player]
        player.addCardToPlay(0)
        round.playTurn()
        let playedCard = round.deck.playedCards[round.deck.playedCards.length - 1]
        expect(playedCard).toEqual(card)
    })

    it('disallows playing a card while +4 is in play', () => {
        let card = { color: 'black', value: '+4' }
        let round = Round()
        let player = Player()
        player.cards = [card]
        round.players = [player]
        player.addCardToPlay(0)
        let played = round.playTurn()
        expect(played).toBe(true)
        card = { color: 'green', value: 1 }
        player = Player()
        player.cards = [card]
        round.players = [player]
        player.addCardToPlay(0)
        played = round.playTurn()
        expect(played).toBe(false)
    })

    it('disallows playing cards other than +2 while +2 is in play', () => {
        const card = { color: 'blue', value: '+2' }
        const round = Round()
        let players = [Player(), Player()]
        players[0].cards = [card]
        players[1].cards = [{ color: 'blue', value: '0' }]
        round.players = players
        players[0].addCardToPlay(0)
        round.playTurn()
        players[1].addCardToPlay(0)
        round.playTurn()
        expect(round.deck.playedCards.pop()).toEqual(card)
    })

    it('changes turn rotation when reverse card is played', () => {
        const card = { color: 'blue', value: 'R' }
        const round = Round()
        let player = Player()
        player.cards = [card, { color: 'blue', value: '0' }]
        round.players = [Player(), player]
        round.turn.playerIndex = 1
        player.addCardToPlay(0)
        round.playTurn()
        expect(round.turn.playerIndex).toBe(0)
    })

    it('skips a player when skip card is played', () => {
        const card = { color: 'blue', value: 'S' }
        const round = Round()
        let player = Player()
        player.cards = [card, { color: 'blue', value: '0' }]
        round.players = [player, player, player]
        player.addCardToPlay(0)
        round.playTurn()
        expect(round.turn.playerIndex).toBe(2)
    })

    it('sets state to finished when playing last card', () => {
        let card = { color: 'blue', value: 1 }
        let round = Round()
        let player = Player()
        player.cards = [card]
        round.players = [player]
        player.addCardToPlay(0)
        round.playTurn()
        expect(round.state).toEqual('FINISHED')
    })

    it('can draw a regular draw only once', () => {
        let round = Round()
        let player = { cards: [] }
        round.players = [player]
        round.drawCards(player)
        round.drawCards(player)
        expect(player.cards.length).toBe(1)
    })

    it('disallows regular drawing unless player has turn', () => {
        let round = Round()
        let player = { cards: [] }
        round.players = [player]
        round.turn.playerIndex = 1
        round.drawCards(player)
        expect(player.cards.length).toBe(0)
        round.turn.playerIndex = 0
        round.drawCards(player)
        expect(player.cards.length).toBe(1)
    })

    it('resets pressedEitt when drawing cards', () => {
        let round = Round()
        let player = { cards: [] }
        round.players = [player]
        player.pressedEitt = true
        round.drawCards(player)
        expect(player.pressedEitt).toBe(false)
    })

    it('allows drawing specified number of cards outside turn', () => {
        let round = Round()
        let player = { cards: [] }
        round.players = [player]
        round.turn.playerIndex = 1
        round.drawCards(player)
        expect(player.cards.length).toBe(0)
        round.drawCards(player, 2)
        expect(player.cards.length).toBe(2)
    })

    it('draws four cards if +4 is in play', () => {
        let round = Round()
        let player = { cards: [] }
        round.players = [player]
        round.turn.plusFourInPlay = true
        round.drawCards(player)
        expect(player.cards.length).toBe(4)
    })

    it('draws double number of +2 cards in play', () => {
        let round = Round()
        let player = { cards: [] }
        round.players = [player]
        round.turn.plusTwoInPlay = 3
        round.drawCards(player)
        expect(player.cards.length).toBe(6)
    })

    it('switches turn after draw if +4 is in play', () => {
        let round = Round()
        let player = { cards: [] }
        round.players = [player, player]
        round.turn.plusFourInPlay = true
        round.drawCards(player)
        expect(round.turn.playerIndex).toBe(1)
    })

    it('switches turn after draw if +2 is in play', () => {
        let round = Round()
        let player = { cards: [] }
        round.players = [player, player]
        round.turn.plusTwoInPlay = 1
        round.drawCards(player)
        expect(round.turn.playerIndex).toBe(1)
    })

    it('changes the card color when playing wildcard from player', () => {
        let round = Round()
        let player = Player()
        player.cards = [{ color: 'black', value: 'W' }]
        round.players = [player]
        player.addCardToPlay(0)
        round.playTurn('blue')
        expect(round.deck.playedCards.pop().color).toBe('blue')
    })

    it('allows checking +4, giving 4 cards if color is found', () => {
        let round = Round()
        let players = [Player(), Player()]
        players[0].cards = [{ color: 'blue'}, { value: '+4' }]
        players[1].cards = []
        round.players = players
        round.deck.playedCards = [{ color: 'blue' }]
        players[0].addCardToPlay(1)
        round.playTurn()
        round.checkPlusFour(players[1])
        expect(players[0].cards.length).toEqual(5)
    })

    it('allows checking +4, giving 6 cards if color is not found', () => {
        let round = Round()
        let players = [Player(), Player()]
        players[0].cards = [{ color: 'blue'}, { value: '+4' }]
        players[1].cards = []
        round.players = players
        round.deck.playedCards = [{ color: 'green' }]
        players[0].addCardToPlay(1)
        round.playTurn()
        round.checkPlusFour(players[1])
        expect(players[1].cards.length).toEqual(6)
    })

    it('disallows playing a card while +4 is in play', () => {
        let round = Round()
        let card = { value: '+4' }
        let players = [Player(), Player()]
        players[0].cards = [card]
        players[1].cards = [{ color: 'blue', value: '0' }]
        round.players = players
        players[0].addCardToPlay(0)
        round.playTurn()
        players[1].addCardToPlay(0)
        round.playTurn()
        expect(round.deck.playedCards.pop()).toEqual(card)
    })

    it('disallows playing cards other than +2 while +2 is in play', () => {
        let round = Round()
        let card = { color: 'blue', value: '+2' }
        let players = [Player(), Player()]
        players[0].cards = [card]
        players[1].cards = [{ color: 'blue', value: '0' }]
        round.players = players
        round.deck.playedCards = []
        players[0].addCardToPlay(0)
        round.playTurn()
        players[1].addCardToPlay(0)
        round.playTurn()
        expect(round.deck.playedCards.pop()).toEqual(card)
    })

    it('disallows playing cards when round is finished', () => {
        let round = Round()
        let player = Player()
        player.cards = [{ value: 'W' }]
        round.players = [player]
        round.state = 'FINISHED'
        round.deck.playedCards = []
        player.addCardToPlay(0)
        round.playTurn()
        expect(player.cards.length).toBe(1)
    })

    it('allows round to continue while +2 is in play', () => {
        let round = Round()
        let players = [Player(), Player()]
        players[0].cards = [{ value: '+2' }]
        players[1].cards = [{ color: 'blue', value: '0' }]
        round.players = players
        round.deck.playedCards = []
        players[0].addCardToPlay(0)
        round.playTurn()
        expect(round.state).toBe('FINISHING')
        round.drawCards(players[1])
        expect(players[1].cards.length).toBe(3)
        expect(round.state).toBe('FINISHED')
    })

    it('waits with finishing until player has drawn when +4 is in play', () => {
        let round = Round()
        let players = [Player(), Player()]
        players[0].cards = [{ value: '+4' }]
        players[1].cards = [{ color: 'blue', value: '0' }]
        round.players = players
        round.deck.playedCards = []
        players[0].addCardToPlay(0)
        round.playTurn()
        expect(round.state).toBe('FINISHING')
        round.drawCards(players[1])
        expect(players[1].cards.length).toBe(5)
        expect(round.state).toBe('FINISHED')
    })

    it('allows pressing eitt before playing second last card', () => {
        let round = Round()
        let player = Player()
        player.cards = [{ value: 'W' }, { value: 'W' }]
        round.players = [player, { cards: [{ color: 'blue', value: '0' }], id: Math.random() }]
        round.pressEitt(player)
        player.addCardToPlay(0)
        expect(player.pressedEitt).toBe(true)
    })

    it('allows pressing eitt after playing second last card', () => {
        let round = Round()
        let player = Player()
        player.cards = [{ value: 'W' }, { value: 'W' }]
        round.players = [player, { cards: [{ color: 'blue', value: '0' }], id: Math.random() }]
        round.pressEitt(player)
        player.addCardToPlay(0)
        round.playTurn()
        round.pressEitt(player)
        expect(player.pressedEitt).toBe(true)
    })

    it('switches turn when playing card from player', () => {
        let round = Round()
        let player = Player()
        player.cards = [{ color: 'black', value: 'W' }, { color: 'black', value: 'W' }]
        round.players = [player, Player()]
        player.addCardToPlay(0)
        round.playTurn()
        expect(round.hasTurn(round.players[0])).toBe(false)
        expect(round.hasTurn(round.players[1])).toBe(true)
    })
})