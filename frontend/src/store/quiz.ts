import { defineStore } from 'pinia';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
}

export interface Question {
  id: string;
  text: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank?: number;
}

export const useQuizStore = defineStore('quiz', {
  state: () => ({
    currentQuiz: null as Quiz | null,
    questions: [] as Question[],
    participantsCount: 0,
    leaderboard: [] as LeaderboardEntry[],
    userScore: 0,
    availableQuizzes: [] as Quiz[],
  }),
  actions: {
    setQuizzes(quizzes: Quiz[]) {
      this.availableQuizzes = quizzes;
    },
    setCurrentQuiz(quiz: Quiz | null) {
      this.currentQuiz = quiz;
    },
    setQuestions(questions: Question[]) {
      this.questions = questions;
    },
    setParticipantsCount(count: number) {
      this.participantsCount = count;
    },
    updateLeaderboard(leaderboard: LeaderboardEntry[]) {
      this.leaderboard = leaderboard;
    },
    setUserScore(score: number) {
      this.userScore = score;
    },
  },
});
