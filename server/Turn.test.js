import { Turn } from './Turn'

describe('Turn', () => {
    it('adds a card to cardsToPlay', () => {
        let turn = Turn()
        let card = { color: 'blue', value: 1 }
        let player = { cards: [card] }
        turn.addCardToPlay(player, 0)
        expect(player.cards[turn.cardsToPlay[0]]).toEqual(card)
    })
    it('allows adding another card when playMultiple is true', () => {
        let turn = Turn(0, true)
        let card = { color: 'blue', value: 1 }
        let card2 = { color: 'green', value: 1 }
        let player = { cards: [card, card2] }
        turn.addCardToPlay(player, 0)
        turn.addCardToPlay(player, 1)
        expect(turn.cardsToPlay.length).toBe(2)
        expect(player.cards[turn.cardsToPlay[0]]).toEqual(card)
        expect(player.cards[turn.cardsToPlay[1]]).toEqual(card2)
    })
    it('disallows adding another card with a different value', () => {
        let turn = Turn(0, true)
        let card = { color: 'blue', value: 1 }
        let card2 = { color: 'blue', value: 2 }
        let player = { cards: [card, card2] }
        turn.addCardToPlay(player, 0)
        turn.addCardToPlay(player, 1)
        expect(turn.cardsToPlay.length).toBe(1)
        expect(player.cards[turn.cardsToPlay[0]]).toEqual(card)
    })
    it('disallows adding another card when playMultiple is false', () => {
        let turn = Turn(0, false)
        let card = { color: 'blue', value: 1 }
        let card2 = { color: 'green', value: 1 }
        let player = { cards: [card, card2] }
        turn.addCardToPlay(player, 0)
        turn.addCardToPlay(player, 1)
        expect(turn.cardsToPlay.length).toBe(1)
        expect(player.cards[turn.cardsToPlay[0]]).toEqual(card)
    })
    it('allows removing a card from cardsToPlay', () => {
        let turn = Turn(0)
        let card = { color: 'blue', value: 1 }
        let player = { cards: [card] }
        turn.addCardToPlay(player, 0)
        turn.removeCardFromPlay(0)
        expect(turn.cardsToPlay.length).toBe(0)
    })
})
