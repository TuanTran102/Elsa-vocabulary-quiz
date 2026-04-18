import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import HostDashboard from '@/views/HostDashboard.vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import { useSessionStore } from '@/store/session'

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

vi.mock('vue-chartjs', () => ({
  Bar: { template: '<div>Bar Chart</div>' }
}))

describe('HostDashboard.vue', () => {
  let router: any

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/host/:pin', component: { name: 'host', template: 'Host' } },
        { path: '/create', component: { name: 'create', template: 'Create' } }
      ]
    })
    
    // Set route params
    await router.push('/host/123456')
    await router.isReady()
    
    vi.clearAllMocks()
  })

  it('renders waiting room correctly', async () => {
    const sessionStore = useSessionStore()
    sessionStore.setSession({
      pin: '123456',
      gameRoomId: 'room1',
      quizTitle: 'Test Quiz',
      status: 'waiting',
      players: [
         { id: '1', nickname: 'Alice' },
         { id: '2', nickname: 'Bob' }
      ]
    })

    const wrapper = mount(HostDashboard, {
      global: {
        plugins: [PrimeVue, router],
        directives: { 'tooltip': Tooltip }
      }
    })

    expect(wrapper.find('[data-testid="pin-display"]').text()).toBe('123456')
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Bob')
    expect(wrapper.find('[data-testid="start-quiz-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="start-quiz-button"]').attributes('disabled')).toBeUndefined()
  })

  it('navigates to in_progress on question_started event', async () => {
    const wrapper = mount(HostDashboard, {
      global: {
        plugins: [PrimeVue, router],
        directives: { 'tooltip': Tooltip }
      }
    })

    // Find the callback for question_started
    const onCall = mockSocket.on.mock.calls.find(call => call[0] === 'question_started')
    expect(onCall).toBeDefined()
    const callback = onCall![1]

    // Trigger event
    callback({
      question: { text: 'What is Vue?', options: [{ id: '1', text: 'Framework' }] },
      duration: 20,
      totalQuestions: 5,
      questionIndex: 0
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Question 1 of 5')
    expect(wrapper.text()).toContain('What is Vue?')
    expect(wrapper.text()).toContain('20') // Timer
  })

  it('renders leaderboard and allows export on quiz_completed', async () => {
    const wrapper = mount(HostDashboard, {
      global: {
        plugins: [PrimeVue, router],
        directives: { 'tooltip': Tooltip }
      }
    })

    const onCall = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_completed')
    const callback = onCall![1]

    callback({
      leaderboard: [
        { nickname: 'Alice', score: 1000 },
        { nickname: 'Bob', score: 800 }
      ]
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Final Results')
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('1000')
    expect(wrapper.text()).toContain('Bob')
    expect(wrapper.text()).toContain('800')
    expect(wrapper.find('[data-testid="export-button"]').exists()).toBe(true)
  })

  it('emits start_quiz when Start button is clicked', async () => {
    const sessionStore = useSessionStore()
    sessionStore.addPlayer({ id: '1', nickname: 'Alice' })

    const wrapper = mount(HostDashboard, {
      global: {
        plugins: [PrimeVue, router],
        directives: { 'tooltip': Tooltip }
      }
    })

    await wrapper.find('[data-testid="start-quiz-button"]').trigger('click')
    expect(mockSocket.emit).toHaveBeenCalledWith('start_quiz', { pin: '123456' })
  })
})
