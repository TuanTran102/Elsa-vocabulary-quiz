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
    expect(store.status).toBe('waiting');
    expect(store.currentQuestion).toBeNull();
    expect(store.timeRemaining).toBe(0);
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

  it('updates status', () => {
    const store = useQuizStore();
    store.setStatus('in_progress');
    expect(store.status).toBe('in_progress');
  });

  it('updates current question', () => {
    const store = useQuizStore();
    const question = { id: 'q1', text: 'Q1', options: [{ id: 'a', text: 'A' }] };
    store.setCurrentQuestion(question);
    expect(store.currentQuestion).toEqual(question);
  });

  it('updates time remaining', () => {
    const store = useQuizStore();
    store.setTimeRemaining(15);
    expect(store.timeRemaining).toBe(15);
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

  it('updates questions', () => {
    const store = useQuizStore();
    const questions = [{ id: 'q1', text: 'Questions?' }];
    store.setQuestions(questions);
    expect(store.questions).toEqual(questions);
  });

  it('updates user score', () => {
    const store = useQuizStore();
    store.setUserScore(200);
    expect(store.userScore).toBe(200);
  });
});
