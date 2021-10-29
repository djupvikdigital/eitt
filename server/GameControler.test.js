import { GameControler } from './GameControler'

describe('GameControler', () => {
    it('sets plusFourInPlay to true', () => {
        const controler = GameControler()
        expect(controler.plusFourInPlay).toBe(false)
        controler.playCard({ value: '+4' })
        expect(controler.plusFourInPlay).toBe(true)
    })

    it('does not draw 4 two times after plusFourInPlay', () => {
        const controler = GameControler()
        controler.playCard({ value: '+4' })
        let cards = controler.drawCards()
        expect(cards.length).toBe(4)
        cards = controler.drawCards()
        expect(cards.length).toBe(1)
    })
})