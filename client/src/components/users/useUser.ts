import { useApi } from '@/modules/connection/Api'
import type { User } from '@/modules/user/User'
import { userStore } from '@/components/users/userStore'
import { storeToRefs } from 'pinia'
import { v4 } from 'uuid'
import { useRouter } from 'vue-router'
import { useSocket } from '@/components/shared/useSocket'

export const useUser = () => {
	const { user } = storeToRefs(userStore())
	const { login, logout } = userStore()
	const { login: apiLogin, getUser, register, refreshAuthToken } = useApi()
	const router = useRouter()
	const { isConnected, connect: connectSocket, disconnect: disconnectSocket } = useSocket()

	// ===================================
	// Authentication
	// ===================================
	const loginUser = async (username: string, password: string): Promise<void> => {
		const { id } = await apiLogin(username, password)

		const user = await getUser(id)
		login(user)
	}

	const logoutUser = () => {
		logout()
		disconnectSocket()
		router.push({ name: 'Login' })
	}

	const refreshUser = async () => {
		if (!user.value?.id) return
		const refreshedUser = await getUser(user.value?.id)
		login(refreshedUser)
	}

	const refreshAuth = async () => {
		await refreshAuthToken()
	}

	const connectSocketWithAutoRefreshAuth = async (): Promise<void> => {
		try {
			await connectSocket()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error connecting to server'

			if (errorMessage !== 'Token expired') throw new Error(errorMessage)

			try {
				await refreshAuth()
				await connectSocket()
			} catch (error) {
				throw new Error('Cannot refresh token')
			}
		}
	}

	// ===================================
	// User creation
	// ===================================
	const createUser = async (params: {
		password: string
		email: string
		name: string
		phone: string
		prefix: string
	}): Promise<void> => {
		const user: User = {
			id: v4(),
			username: params.email,
			password: params.password,
			email: params.email,
			name: params.name,
			phone: `${params.prefix}${params.phone}`,
			createdAt: new Date().getTime()
		}
		await register(user)
	}

	return {
		user,
		loginUser,
		logoutUser,
		refreshUser,
		refreshAuth,
		createUser,
		isConnected,
		connectSocketWithAutoRefreshAuth
	}
}
