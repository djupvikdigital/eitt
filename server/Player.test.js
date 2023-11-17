import { Player } from './Player'

describe('Player', () => {
    it('adds a card to cardsToPlay', () => {
        let player = Player()
        let card = { color: 'blue', value: 1 }
        player.cards = [card]
        player.addCardToPlay(0)
        expect(player.cards[player.cardsToPlay[0]]).toEqual(card)
    })

    it('allows adding another card when playMultiple is true', () => {
        let player = Player()
        let card = { color: 'blue', value: 1 }
        let card2 = { color: 'green', value: 1 }
        player.playMultiple = true
        player.cards = [card, card2]
        player.addCardToPlay(0)
        player.addCardToPlay(1)
        expect(player.cardsToPlay.length).toBe(2)
        expect(player.cards[player.cardsToPlay[0]]).toEqual(card)
        expect(player.cards[player.cardsToPlay[1]]).toEqual(card2)
    })

    it('disallows adding another card with a different value', () => {
        let player = Player()
        let card = { color: 'blue', value: 1 }
        let card2 = { color: 'blue', value: 2 }
        player.playMultiple = true
        player.cards = [card, card2]
        player.addCardToPlay(0)
        player.addCardToPlay(1)
        expect(player.cardsToPlay.length).toBe(1)
        expect(player.cards[player.cardsToPlay[0]]).toEqual(card)
    })

    it('disallows adding another card when playMultiple is false', () => {
        let player = Player()
        let card = { color: 'blue', value: 1 }
        let card2 = { color: 'green', value: 1 }
        player.cards = [card, card2]
        player.addCardToPlay(0)
        player.addCardToPlay(1)
        expect(player.cardsToPlay.length).toBe(1)
        expect(player.cards[player.cardsToPlay[0]]).toEqual(card)
    })

    it('allows removing a card from cardsToPlay', () => {
        let player = Player()
        let card = { color: 'blue', value: 1 }
        player.cards = [card]
        player.addCardToPlay(0)
        player.removeCardFromPlay(0)
        expect(player.cardsToPlay.length).toBe(0)
    })
})
