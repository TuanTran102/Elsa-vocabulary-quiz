import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import PlayPage from '@/views/PlayPage.vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import { useUserStore } from '@/store/user'

// Mock socket
const mockSocket = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn()
}

vi.mock('@/composables/useSocket', () => ({
  useSocket: () => mockSocket
}))

// Mock fetch for midway re-join
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('PlayPage.vue', () => {
  let router: any

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/play/:pin', component: { name: 'play', template: 'Play' } },
        { path: '/results/:pin', component: { name: 'results', template: 'Results' } },
        { path: '/join', component: { name: 'join', template: 'Join' } }
      ]
    })
    
    const userStore = useUserStore()
    userStore.setPin('123456')
    userStore.setNickname('TestPlayer')
    
    await router.push('/play/123456')
    await router.isReady()
    
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'waiting' })
    })
  })

  it('initializes socket listeners and fetches session on mount', async () => {
    mount(PlayPage, {
      global: {
        plugins: [PrimeVue, ToastService, router]
      }
    })

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/v1/sessions/123456'))
    expect(mockSocket.on).toHaveBeenCalledWith('question_started', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('question_ended', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('answer_result', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('leaderboard_update', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('quiz_completed', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('host_disconnected', expect.any(Function))
  })

  it('transitions state on question_started', async () => {
    const wrapper = mount(PlayPage, {
      global: {
        plugins: [PrimeVue, ToastService, router]
      }
    })

    const callback = mockSocket.on.mock.calls.find(call => call[0] === 'question_started')![1]
    
    callback({
      question: { 
        text: 'What is Vue?', 
        options: [
          { id: '1', text: 'Option A' },
          { id: '2', text: 'Option B' }
        ] 
      },
      duration: 20,
      totalQuestions: 5,
      questionIndex: 0
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Question 1 / 5')
    expect(wrapper.text()).toContain('What is Vue?')
    const options = wrapper.findAll('[data-testid="option-button"]')
    expect(options).toHaveLength(2)
    expect(options[0].attributes('disabled')).toBeUndefined()
  })

  it('emits submit_answer and disables options on click', async () => {
    const wrapper = mount(PlayPage, {
      global: {
        plugins: [PrimeVue, ToastService, router]
      }
    })

    const callback = mockSocket.on.mock.calls.find(call => call[0] === 'question_started')![1]
    callback({
      question: { 
        text: 'Q', 
        options: [{ id: '1', text: 'A' }] 
      },
      duration: 20,
      totalQuestions: 1,
      questionIndex: 0
    })
    await flushPromises()

    await wrapper.find('[data-testid="option-button"]').trigger('click')

    expect(mockSocket.emit).toHaveBeenCalledWith('submit_answer', {
      pin: '123456',
      answerId: '1'
    })
    expect(wrapper.find('[data-testid="option-button"]').attributes('disabled')).toBeDefined()
  })

  it('highlights correct answer and shows distribution on question_ended', async () => {
    const wrapper = mount(PlayPage, {
      global: {
        plugins: [PrimeVue, ToastService, router]
      }
    })

    // Start question first
    const startCallback = mockSocket.on.mock.calls.find(call => call[0] === 'question_started')![1]
    startCallback({
      question: { 
        text: 'Q', 
        options: [
          { id: '1', text: 'Correct' },
          { id: '2', text: 'Wrong' }
        ] 
      },
      duration: 20,
      totalQuestions: 1,
      questionIndex: 0
    })
    await flushPromises()

    const endCallback = mockSocket.on.mock.calls.find(call => call[0] === 'question_ended')![1]
    endCallback({
      correctAnswerId: '1',
      distribution: { '1': 75, '2': 25 }
    })
    await flushPromises()

    const options = wrapper.findAll('[data-testid="option-button"]')
    expect(options[0].classes()).toContain('is-correct')
    expect(wrapper.find('[data-testid="distribution-bar-1"]').attributes('style')).toContain('width: 75%')
  })

  it('navigates to results on quiz_completed', async () => {
    mount(PlayPage, {
      global: {
        plugins: [PrimeVue, ToastService, router]
      }
    })

    const callback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_completed')![1]
    callback({
      leaderboard: [{ nickname: 'TestPlayer', score: 1000 }]
    })

    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/results/123456')
  })

  it('handles host_disconnected by showing modal', async () => {
    const wrapper = mount(PlayPage, {
      global: {
        plugins: [PrimeVue, ToastService, router]
      }
    })

    const callback = mockSocket.on.mock.calls.find(call => call[0] === 'host_disconnected')![1]
    callback()

    await flushPromises()
    await nextTick()
    expect(wrapper.find('[data-testid="host-disconnected-container"]').exists()).toBe(true)
  })

  it('syncs state on midway re-join', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'in_progress',
        currentQuestion: {
          text: 'Active Question',
          options: [{ id: '1', text: 'Opt' }]
        },
        questionIndex: 2,
        totalQuestions: 10,
        timeRemaining: 15,
        hasAnswered: false
      })
    })

    const wrapper = mount(PlayPage, {
      global: {
        plugins: [PrimeVue, ToastService, router]
      }
    })

    await flushPromises()
    await nextTick()

    expect(wrapper.text()).toContain('Question 3 / 10')
    expect(wrapper.text()).toContain('Active Question')
    expect(wrapper.text()).toContain('15') // Timer
  })
})
