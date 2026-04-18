import { createRouter, createWebHistory } from 'vue-router';
import Lobby from '@/views/Lobby.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'lobby',
      component: Lobby,
    },
    {
      path: '/quiz/:id',
      name: 'quiz-room',
      component: () => import('@/views/QuizRoom.vue'), // Placeholder component
    },
  ],
});

export default router;
