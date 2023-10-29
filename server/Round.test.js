import { Round } from './Round'
import { Turn } from './Turn'

describe('Round', () => {
    it('can play a turn', () => {
        let turn = Turn()
        let card = { color: 'blue', value: 1 }
        let round = Round()
        turn.addCardToPlay(card)
        round.playTurn(turn)
        let playedCard = round.deck.playedCards[round.deck.playedCards.length - 1]
        expect(playedCard).toEqual(turn.cardsToPlay[turn.cardsToPlay.length - 1])
        expect(playedCard).toEqual(card)
    })
})