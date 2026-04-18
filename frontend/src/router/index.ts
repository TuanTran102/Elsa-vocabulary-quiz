import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import HomePage from '@/views/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/join',
      name: 'join',
      component: () => import('@/views/JoinPage.vue'),
    },
    {
      path: '/lobby/:pin',
      name: 'lobby',
      component: () => import('@/views/LobbyPage.vue'),
      meta: { requiresSession: true }
    },
    {
      path: '/play/:pin',
      name: 'play',
      component: () => import('@/views/QuizRoom.vue'),
      meta: { requiresSession: true }
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  if (to.meta.requiresSession) {
    const userStore = useUserStore()
    const pin = to.params.pin as string

    // 1. Check if store PIN matches route PIN
    if (userStore.pin !== pin) {
      return next('/join')
    }

    // 2. Verify session via API
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/v1/sessions/${pin}`)
      if (!response.ok) {
        userStore.reset()
        return next('/join')
      }
      const data = await response.json()
      if (data.status === 'finished') {
        userStore.reset()
        return next('/join')
      }
      next()
    } catch (error) {
      console.error('Session validation failed', error)
      next('/join')
    }
  } else {
    next()
  }
})

export default router
