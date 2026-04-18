import { defineStore } from 'pinia';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
}

export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options?: AnswerOption[];
}

export type QuizStatus = 'waiting' | 'in_progress' | 'completed';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank?: number;
}

export const useQuizStore = defineStore('quiz', {
  state: () => ({
    currentQuiz: null as Quiz | null,
    status: 'waiting' as QuizStatus,
    currentQuestion: null as Question | null,
    timeRemaining: 0,
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
    setStatus(status: QuizStatus) {
      this.status = status;
    },
    setCurrentQuiz(quiz: Quiz | null) {
      this.currentQuiz = quiz;
    },
    setCurrentQuestion(question: Question | null) {
      this.currentQuestion = question;
    },
    setTimeRemaining(time: number) {
      this.timeRemaining = time;
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
    async fetchQuizzes() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/v1/quizzes`);
        if (response.ok) {
          const json = await response.json();
          // The API returns an object { data: [...] }
          this.setQuizzes(json.data || []);
        } else {
          console.error('Failed to fetch quizzes:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      }
    },
  },
});
