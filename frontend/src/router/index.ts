import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useSessionStore } from '@/store/session'
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
      component: () => import('@/views/PlayPage.vue'),
      meta: { requiresSession: true }
    },
    {
      path: '/results/:pin',
      name: 'results',
      component: () => import('@/views/ResultsPage.vue'),
      meta: { requiresSession: true }
    },
    {
      path: '/create',
      name: 'create',
      component: () => import('@/views/CreatePage.vue'),
    },
    {
      path: '/host/:pin',
      name: 'host',
      component: () => import('@/views/HostDashboard.vue'),
      meta: { requiresMaster: true }
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const sessionStore = useSessionStore()
  const userStore = useUserStore()

  if (to.meta.requiresMaster) {
    const pin = to.params.pin as string
    if (sessionStore.masterToken && sessionStore.pin === pin) {
      return next()
    }
    // If no token or wrong PIN, check if we can reclaim (this will be handled by the component, 
    // but we allow access if token exists in localStorage which is handled by store init)
    if (sessionStore.masterToken) {
      return next()
    }
    return next('/create')
  }

  if (to.meta.requiresSession) {
    const pin = to.params.pin as string

    // 1. Check if store PIN matches route PIN and nickname exists
    if (userStore.pin !== pin || !userStore.nickname) {
      return next('/join')
    }

    // 2. Verify session via API
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const response = await fetch(`${apiUrl}/v1/sessions/${pin}`)
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
