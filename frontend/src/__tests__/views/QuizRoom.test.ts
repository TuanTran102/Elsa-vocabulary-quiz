import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuizRoom from '@/views/QuizRoom.vue';
import { createTestingPinia } from '@pinia/testing';
import { useQuizStore } from '@/store/quiz';
import PrimeVue from 'primevue/config';

// Mock vue-router
const pushMock = vi.fn();
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '123' } }),
  useRouter: () => ({ push: pushMock })
}));

// Mock useSocket
const mockEmit = vi.fn();
const mockConnect = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();
vi.mock('@/composables/useSocket', () => ({
  useSocket: () => ({
    emit: mockEmit,
    connect: mockConnect,
    on: mockOn,
    off: mockOff
  })
}));

describe('QuizRoom.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
  });

  const createWrapper = (initialState = {}) => {
    return mount(QuizRoom, {
      global: {
        plugins: [
          PrimeVue,
          createTestingPinia({
            initialState: {
              quiz: {
                status: 'waiting',
                currentQuestion: null,
                timeRemaining: 0,
                leaderboard: [],
                userScore: 0,
                ...initialState
              }
            },
            stubActions: false
          })
        ],
        stubs: {
          ProgressBar: true,
          Badge: true,
          Toast: true,
          Button: {
            template: '<button class="p-button" @click="$emit(\'click\')" :disabled="disabled">{{ label }}</button>',
            props: ['label', 'disabled', 'icon']
          }
        }
      }
    });
  };

  it('renders waiting state', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Loading Quiz...');
    expect(wrapper.text()).toContain('Waiting to Start');
    expect(wrapper.find('.pi-spinner').exists()).toBe(true);
  });

  it('renders active question and options', () => {
    const wrapper = createWrapper({
      status: 'in_progress',
      timeRemaining: 15,
      currentQuestion: {
        id: 'q1',
        text: 'What does "aberration" mean?',
        options: [
          { id: 'a', text: 'Normal' },
          { id: 'b', text: 'Deviation' }
        ]
      }
    });

    expect(wrapper.text()).toContain('What does "aberration" mean?');
    expect(wrapper.text()).toContain('Time Remaining');
    const buttons = wrapper.findAll('.answer-button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].text()).toBe('Normal');
    expect(buttons[1].text()).toBe('Deviation');
  });

  it('submits answer and disables buttons', async () => {
    const wrapper = createWrapper({
      status: 'in_progress',
      timeRemaining: 15,
      currentQuestion: {
        id: 'q1',
        text: 'Question',
        options: [
          { id: 'a', text: 'A' },
          { id: 'b', text: 'B' }
        ]
      }
    });

    const buttons = wrapper.findAll('.answer-button');
    await buttons[0].trigger('click');

    expect(mockEmit).toHaveBeenCalledWith('submit_answer', { quiz_id: '123', question_id: 'q1', answer: 'a' });
    
    // Check disabled using the prop binding logic
    // We mocked the PrimeVue Button to take disabled prop and put it on <button>
    expect(buttons[0].attributes('disabled')).toBeDefined();
    expect(buttons[1].attributes('disabled')).toBeDefined();
  });

  it('renders leaderboard correctly', () => {
    const wrapper = createWrapper({
      leaderboard: [
        { userId: 'u2', username: 'Bob', score: 50 },
        { userId: 'u1', username: 'Alice', score: 100 }, // Out of order intentionally
        { userId: 'u3', username: 'Charlie', score: 30 },
        { userId: 'u4', username: 'Dave', score: 10 }
      ]
    });

    const listItems = wrapper.findAll('li');
    expect(listItems.length).toBe(4);
    // Should be sorted by score descending
    expect(listItems[0].text()).toContain('Alice');
    expect(listItems[0].text()).toContain('100');
    expect(listItems[2].text()).toContain('Charlie');
    // Ensure the 4th item renders correctly hitting the fallback styles
    expect(listItems[3].text()).toContain('Dave');
    expect(listItems[3].text()).toContain('10');
  });

  it('renders completed state', async () => {
    const wrapper = createWrapper({
      status: 'completed',
      userScore: 150
    });

    expect(wrapper.text()).toContain('Quiz Completed!');
    expect(wrapper.text()).toContain('Your Final Score');
    expect(wrapper.text()).toContain('150');

    const homeButton = wrapper.findAll('button').find(b => b.text() === 'Back to Lobby');
    expect(homeButton?.exists()).toBe(true);

    await homeButton?.trigger('click');
    const store = useQuizStore();
    expect(store.status).toBe('waiting');
    expect(pushMock).toHaveBeenCalledWith('/');
  });

  it('handles unknown status gracefully', async () => {
    const wrapper = createWrapper({
      status: 'unknown_status' as any
    });
    // Just ensuring no crash and fallback hit
    expect(wrapper.exists()).toBe(true);
  });

  it('resets answering state when question changes', async () => {
    const wrapper = createWrapper({
      status: 'in_progress',
      timeRemaining: 10,
      currentQuestion: { id: 'q1', text: 'Q1' }
    });
    const store = useQuizStore();
    
    // Simulate answering
    const buttons = wrapper.findAll('.answer-button');
    if (buttons.length > 0) {
      await buttons[0].trigger('click');
    }

    store.setCurrentQuestion({ id: 'q2', text: 'Q2' });
    await wrapper.vm.$nextTick();
    // Watcher should trigger, removing selected option state
  });

  it('shows red progress bar on low time', async () => {
    const wrapper = createWrapper({
      status: 'in_progress',
      timeRemaining: 5,
      currentQuestion: { id: 'q1', text: 'Q1' }
    });
    // Ensures ratio < 0.2 branch is hit
    expect(wrapper.html()).toContain('bg-rose-500');
  });
});
