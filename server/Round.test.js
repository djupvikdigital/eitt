import { CardDeck } from './CardDeck'
import { Round } from './Round'
import { Turn } from './Turn'

describe('Round', () => {
    it('can play a turn', () => {
        let card = { color: 'blue', value: 1 }
        let round = Round()
        let player = { cards: [card] }
        round.players = [player]
        round.turn.addCardToPlay(player, 0)
        round.playTurn()
        let playedCard = round.deck.playedCards[round.deck.playedCards.length - 1]
        expect(playedCard).toEqual(card)
    })

    it('disallows playing a card while +4 is in play', () => {
        let card = { color: 'black', value: '+4' }
        let round = Round()
        let player = { cards: [card] }
        round.players = [player]
        round.turn.addCardToPlay(player, 0)
        let played = round.playTurn()
        expect(played).toBe(true)
        card = { color: 'green', value: 1 }
        player = { cards: [card] }
        round.players = [player]
        round.turn.addCardToPlay(player, 0)
        played = round.playTurn()
        expect(played).toBe(false)
    })

    it('disallows playing cards other than +2 while +2 is in play', () => {
        const card = { color: 'blue', value: '+2' }
        const round = Round()
        round.players = [{ cards: [card] }, { cards: [{ color: 'blue', value: '0' }] }]
        round.turn.addCardToPlay(round.players[0], 0)
        round.playTurn()
        round.turn.addCardToPlay(round.players[1], 0)
        round.playTurn()
        expect(round.deck.playedCards.pop()).toEqual(card)
    })

    it('changes turn rotation when reverse card is played', () => {
        const card = { color: 'blue', value: 'R' }
        const round = Round()
        let player = { cards: [card] }
        round.players = [player, player, player]
        round.turn.playerIndex = 1
        round.turn.addCardToPlay(player, 0)
        round.playTurn()
        expect(round.turn.playerIndex).toBe(0)
    })

    it('skips a player when skip card is played', () => {
        const card = { color: 'blue', value: 'S' }
        const round = Round()
        let player = { cards: [card] }
        round.players = [player, player, player]
        round.turn.addCardToPlay(player, 0)
        round.playTurn()
        expect(round.turn.playerIndex).toBe(2)
    })

    it('sets state to finished when playing last card', () => {
        let card = { color: 'blue', value: 1 }
        let round = Round()
        let player = { cards: [card] }
        round.players = [player]
        round.turn.addCardToPlay(player, 0)
        round.playTurn()
        expect(round.state).toEqual('FINISHED')
    })

    it('can draw a regular draw only once', () => {
        let round = Round()
        let player = { cards: [] }
        round.drawCards(player)
        round.drawCards(player)
        expect(player.cards.length).toBe(1)
    })

    it('draws four cards if +4 is in play', () => {
        let round = Round()
        let player = { cards: [] }
        round.turn.plusFourInPlay = true
        round.drawCards(player)
        expect(player.cards.length).toBe(4)
    })

    it('draws double number of +2 cards in play', () => {
        let round = Round()
        let player = { cards: [] }
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
        let player = { cards: [{ color: 'black', value: 'W' }] }
        round.players = [player]
        round.turn.addCardToPlay(player, 0)
        round.playTurn('blue')
        expect(round.deck.playedCards.pop().color).toBe('blue')
    })

    it('allows checking +4, giving 4 cards if color is found', () => {
        let round = Round()
        let players = [{ cards: [{ value: '+4' }, { color: 'blue' }] }, {cards: [] }]
        round.players = players
        round.deck.playedCards = [{ color: 'blue' }]
        round.turn.addCardToPlay(players[0], 0)
        round.playTurn()
        round.checkPlusFour(players[1])
        expect(players[0].cards.length).toEqual(5)
    })

    it('allows checking +4, giving 6 cards if color is not found', () => {
        let round = Round()
        let players = [ { cards: [{ color: 'blue'}, { value: '+4' }] }, { cards: [] }]
        round.players = players
        round.deck.playedCards = [{ color: 'green' }]
        round.turn.addCardToPlay(players[0], 1)
        round.playTurn()
        round.checkPlusFour(players[1])
        expect(players[1].cards.length).toEqual(6)
    })
})