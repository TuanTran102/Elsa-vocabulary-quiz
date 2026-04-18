import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LobbyPage from '@/views/LobbyPage.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useSessionStore } from '@/store/session'
import PrimeVue from 'primevue/config'

describe('LobbyPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should display room PIN and player count', async () => {
    const sessionStore = useSessionStore()
    sessionStore.setSession({
      pin: '123456',
      gameRoomId: 'room1',
      quizTitle: 'Cool Quiz',
      status: 'waiting',
      players: [
        { id: '1', nickname: 'Alice' },
        { id: '2', nickname: 'Bob' }
      ]
    })

    const wrapper = mount(LobbyPage, {
      global: {
        plugins: [PrimeVue],
        stubs: {
          'router-link': true
        }
      }
    })

    expect(wrapper.text()).toContain('123 456')
    expect(wrapper.text()).toContain('2 Players')
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Bob')
  })
})
