import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import JoinPage from '@/views/JoinPage.vue'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'

// Mock vue-router
const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock
  })
}))

// Mock useSocket
vi.mock('@/composables/useSocket', () => ({
  useSocket: () => ({
    emit: vi.fn(),
    connect: vi.fn()
  })
}))

// Mock fetch
vi.stubGlobal('fetch', vi.fn())

describe('JoinPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should only show PIN input initially', () => {
    const wrapper = mount(JoinPage, {
      global: {
        plugins: [PrimeVue]
      }
    })
    expect(wrapper.find('input[placeholder="Enter PIN"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="Enter Nickname"]').exists()).toBe(false)
  })

  it('should transition to nickname input after valid PIN', async () => {
    ;(fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pin: '123456' })
    })

    const wrapper = mount(JoinPage, {
      global: {
        plugins: [PrimeVue]
      }
    })
    
    const pinInput = wrapper.find('input[placeholder="Enter PIN"]')
    await pinInput.setValue('123456')
    await wrapper.find('button').trigger('click') // Submit PIN

    expect(fetch).toHaveBeenCalled()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick() // Wait for state change

    expect(wrapper.find('input[placeholder="Enter Nickname"]').exists()).toBe(true)
  })

  it('should show error message for invalid PIN', async () => {
    ;(fetch as any).mockResolvedValue({
      ok: false,
      status: 404
    })

    const wrapper = mount(JoinPage, {
      global: {
        plugins: [PrimeVue]
      }
    })
    
    await wrapper.find('input[placeholder="Enter PIN"]').setValue('000000')
    await wrapper.find('button').trigger('click')

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Invalid room PIN')
  })
})
