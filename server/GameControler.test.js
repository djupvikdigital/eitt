import { jest } from '@jest/globals'

import { GameControler } from './GameControler'
import { Player } from './Player'

jest.useFakeTimers()

function noop() {
    return
}

function setupControlerWithMocks(player = setupMockPlayer()) {
    const controler = GameControler('', { [player.id]: player }, { 0: {}})
    controler.connected = [player.id]
    return controler
}

function setupMockPlayer() {
    const playerId = 0
    return Player(playerId, { 0: { emit: noop }})
}

describe('GameControler', () => {
    it('sets plusFourInPlay to true', () => {
        const controler = setupControlerWithMocks()
        expect(controler.plusFourInPlay).toBe(false)
        controler.playCard({ value: '+4' })
        expect(controler.plusFourInPlay).toBe(true)
    })

    it('does not draw 4 two times after plusFourInPlay', () => {
        const player = setupMockPlayer()
        const controler = setupControlerWithMocks(player)
        controler.playCard({ value: '+4' })
        controler.drawCards(player)
        expect(player.cards.length).toBe(4)
        controler.drawCards(player)
        expect(player.cards.length).toBe(5)
    })

    it('allows round to continue while +2 is in play', () => {
        const player = setupMockPlayer()
        const controler = setupControlerWithMocks(player)
        controler.roundFinished = true
        controler.playCard({ value: '+2' })
        expect(controler.roundFinished).toBe(true)
        controler.drawCards(player)
        expect(player.cards.length).toBe(7)
        expect(controler.roundFinished).toBe(false)
    })
})