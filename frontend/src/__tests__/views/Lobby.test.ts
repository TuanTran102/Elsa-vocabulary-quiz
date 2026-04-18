import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Lobby from '@/views/Lobby.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useQuizStore } from '@/store/quiz';
import PrimeVue from 'primevue/config';
import { useRouter } from 'vue-router';

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

describe('Lobby View', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders available quizzes', async () => {
    const store = useQuizStore();
    store.setQuizzes([
      { id: '1', title: 'English Quiz', description: 'Test your English' },
      { id: '2', title: 'Math Quiz', description: 'Test your Math' },
    ]);

    const wrapper = mount(Lobby, {
      global: {
        plugins: [PrimeVue],
      },
    });

    expect(wrapper.text()).toContain('English Quiz');
    expect(wrapper.text()).toContain('Math Quiz');
  });

  it('redirects to quiz room on join', async () => {
    const store = useQuizStore();
    store.setQuizzes([{ id: '1', title: 'English Quiz' }]);
    
    const router = useRouter();
    const wrapper = mount(Lobby, {
      global: {
        plugins: [PrimeVue],
      },
    });

    const joinButton = wrapper.find('button');
    await joinButton.trigger('click');

    expect(router.push).toHaveBeenCalledWith('/quiz/1');
  });
});
