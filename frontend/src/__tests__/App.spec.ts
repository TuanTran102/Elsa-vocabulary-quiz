import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import PrimeVue from 'primevue/config';
import App from '../App.vue';
import { createRouter, createWebHistory } from 'vue-router';

// Mock Router
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div>Lobby</div>' } }]
});

// Mock Socket Composable
vi.mock('@/composables/useSocket', () => ({
  useSocket: () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

describe('App Smoke Test', () => {
  it('renders the application shell', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [PrimeVue, router],
      }
    });
    
    expect(wrapper.find('header h1').text()).toBe('ELSA Quiz');
    expect(wrapper.find('main').exists()).toBe(true);
    expect(wrapper.find('footer').exists()).toBe(true);
  });
});
