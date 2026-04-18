import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import ResultsPage from '@/views/ResultsPage.vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import PrimeVue from 'primevue/config'
import { useUserStore } from '@/store/user'

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}))

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('ResultsPage.spec.ts', () => {
  let router: any

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/results/:pin', component: { name: 'results', template: 'Results' } },
        { path: '/join', component: { name: 'join', template: 'Join' } }
      ]
    })
    
    const userStore = useUserStore()
    userStore.setPin('123456')
    userStore.setNickname('Me')
    userStore.setScore(5000)
    userStore.setRank(1)
    
    await router.push('/results/123456')
    await router.isReady()
    
    vi.clearAllMocks()
  })

  it('renders final score and rank correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        leaderboard: [{ nickname: 'Me', score: 5000, rank: 1 }]
      })
    })

    const wrapper = mount(ResultsPage, {
      global: {
        plugins: [PrimeVue, router]
      }
    })
    await flushPromises()
    await nextTick()

    expect(wrapper.text()).toContain('5000')
    expect(wrapper.text()).toContain('#1')
  })

  it('renders podium and full leaderboard', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        leaderboard: [
          { nickname: 'Me', score: 5000, rank: 1 },
          { nickname: 'Player 2', score: 4000, rank: 2 },
          { nickname: 'Player 3', score: 3000, rank: 3 },
          { nickname: 'Player 4', score: 2000, rank: 4 }
        ]
      })
    })

    const wrapper = mount(ResultsPage, {
      global: {
        plugins: [PrimeVue, router]
      }
    })
    await flushPromises()
    await nextTick()

    const podiumItems = wrapper.findAll('[data-testid="podium-item"]')
    expect(podiumItems.length).toBeGreaterThanOrEqual(1)
    
    const leaderboardItems = wrapper.findAll('[data-testid^="leaderboard-item-"]')
    expect(leaderboardItems).toHaveLength(4)
  })

  it('highlights user context in leaderboard', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        leaderboard: [{ nickname: 'Me', score: 5000, rank: 1 }]
      })
    })

    const wrapper = mount(ResultsPage, {
      global: {
        plugins: [PrimeVue, router]
      }
    })
    await flushPromises()
    await nextTick()

    const me = wrapper.find('[data-testid="leaderboard-item-Me"]')
    expect(me.classes()).toContain('is-current-user')
  })

  it('navigates to join on Play Again click', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ leaderboard: [] })
    })

    const wrapper = mount(ResultsPage, {
      global: {
        plugins: [PrimeVue, router]
      }
    })
    await flushPromises()
    await nextTick()

    await wrapper.find('[data-testid="play-again-button"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/join')
  })
})
