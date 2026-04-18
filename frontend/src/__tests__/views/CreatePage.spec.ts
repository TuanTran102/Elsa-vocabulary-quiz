import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import CreatePage from '@/views/CreatePage.vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import PrimeVue from 'primevue/config'

// Mock fetch
const mockQuizzes = [
  { id: '1', title: 'Quiz 1', description: 'Desc 1', _count: { questions: 5 } },
  { id: '2', title: 'Quiz 2', description: 'Desc 2', _count: { questions: 10 } }
]

vi.stubGlobal('fetch', vi.fn())

describe('CreatePage.vue', () => {
  let router: any

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: 'Home' } },
        { path: '/host/:pin', component: { name: 'host', template: 'Host' } }
      ]
    })
    vi.clearAllMocks()
    vi.stubEnv('VITE_API_URL', 'http://test-api')
  })

  it('renders loading state initially', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => new Promise(resolve => setTimeout(() => resolve([]), 10))
    })

    const wrapper = mount(CreatePage, {
      global: {
        plugins: [PrimeVue, router]
      }
    })

    expect(wrapper.find('.p-progressspinner').exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading available quizzes...')
  })

  it('renders quiz list after fetching', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockQuizzes)
    })

    const wrapper = mount(CreatePage, {
      global: {
        plugins: [PrimeVue, router]
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Quiz 1')
    expect(wrapper.text()).toContain('Quiz 2')
    expect(wrapper.text()).toContain('5 Questions')
  })

  it('handles error state', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: false
    })

    const wrapper = mount(CreatePage, {
      global: {
        plugins: [PrimeVue, router]
      }
    })

    await flushPromises()

    expect(wrapper.find('.p-message-error').exists()).toBe(true)
    expect(wrapper.text()).toContain('Failed to fetch quizzes')
  })

  it('creates session and navigates on quiz selection', async () => {
    ;(fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockQuizzes)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          pin: '123456',
          gameRoomId: 'room1',
          masterToken: 'm-token',
          session: {
            status: 'waiting',
            quiz: { title: 'Quiz 1' }
          }
        })
      })

    const wrapper = mount(CreatePage, {
      global: {
        plugins: [PrimeVue, router]
      }
    })

    await flushPromises()

    const pushSpy = vi.spyOn(router, 'push')
    const selectButton = wrapper.find('button')
    await selectButton.trigger('click')

    expect(fetch).toHaveBeenCalledWith('http://test-api/v1/sessions', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ quizId: '1' })
    }))

    await flushPromises()
    expect(pushSpy).toHaveBeenCalledWith('/host/123456')
  })
})
