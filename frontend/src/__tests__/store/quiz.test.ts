import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import { useQuizStore } from '@/store/quiz';

describe('Quiz Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('has initial state', () => {
    const store = useQuizStore();
    expect(store.currentQuiz).toBeNull();
    expect(store.questions).toEqual([]);
    expect(store.participantsCount).toBe(0);
    expect(store.leaderboard).toEqual([]);
    expect(store.userScore).toBe(0);
    expect(store.availableQuizzes).toEqual([]);
  });

  it('updates available quizzes', () => {
    const store = useQuizStore();
    const quizzes = [{ id: '1', title: 'Quiz 1' }];
    store.setQuizzes(quizzes as any);
    expect(store.availableQuizzes).toEqual(quizzes);
  });

  it('updates current quiz', () => {
    const store = useQuizStore();
    const quiz = { id: '1', title: 'Quiz 1' };
    store.setCurrentQuiz(quiz as any);
    expect(store.currentQuiz).toEqual(quiz);
  });

  it('updates leaderboard', () => {
    const store = useQuizStore();
    const leaderboard = [{ userId: '1', username: 'User 1', score: 10 }];
    store.updateLeaderboard(leaderboard as any);
    expect(store.leaderboard).toEqual(leaderboard);
  });

  it('updates participants count', () => {
    const store = useQuizStore();
    store.setParticipantsCount(10);
    expect(store.participantsCount).toBe(10);
  });
});
