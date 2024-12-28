import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useUser } from '@/components/users/useUser'

const router = createRouter({
	history: createWebHashHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'home',
			component: HomeView,
			children: [
				{
					path: 'bots',
					name: 'Bots',
					component: () => import('@/components/bots/BotsView.vue')
				},
				{
					path: 'bots/:name',
					name: 'BotConfig',
					component: () => import('@/components/bots/config/BotConfig.vue')
				},
				{
					path: 'aicontexts',
					name: 'Contexts',
					component: () => import('@/components/aiContexts/AiContextsView.vue')
				},
				{
					path: 'aicontext/:id?',
					name: 'Context',
					component: () => import('@/components/aiContexts/AiContext.vue')
				},
				{
					path: 'contacts',
					name: 'Contacts',
					component: () => import('@/components/contacts/ContactsView.vue')
				},
				{
					path: 'contact/:id?',
					name: 'Contact',
					component: () => import('@/components/contacts/ContactSingle.vue')
				},
				{
					path: 'settings',
					name: 'Settings',
					component: () => import('@/components/aiConfig/SettingsView.vue')
				},
				{
					path: '/:pathMatch(.*)*',
					redirect: 'bots'
				}
			]
		},
		{
			path: '/login',
			name: 'Login',
			component: () => import('../views/LoginView.vue')
		},
		{
			path: '/register',
			name: 'Register',
			component: () => import('../views/RegisterView.vue')
		},
		{
			path: '/:pathMatch(.*)*',
			redirect: '/'
		}
	]
})

// Add a global navigation guard
router.beforeEach(async (to, from, next) => {
	const { user, connectSocketWithAutoRefreshAuth, isConnected, logoutUser } = useUser()
	const isGoingToLoginOrRegister = to.name === 'Login' || to.name === 'Register'

	// If the user is going to the login or register page, let them always go
	if (isGoingToLoginOrRegister) {
		next()
		return
	}

	// If the user is not logged in, redirect to the login page
	if (!user.value) {
		next({ name: 'Login' })
		return
	}

	// If the user is logged in and the socket is not connected, try to connect
	if (!isConnected()) {
		try {
			await connectSocketWithAutoRefreshAuth()
		} catch (error) {
			logoutUser()
			return
		}
	}

	// If the user is logged in and the socket is connected, let them go
	next()
})

export default router
