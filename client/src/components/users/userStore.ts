import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { socket } from '@/modules/connection/Socket'
import type { User } from '@/modules/user/User'

const storedUser = localStorage.getItem('jeffriuser') ? JSON.parse(localStorage.getItem('jeffriuser') as string) : null

export const userStore = defineStore('user', () => {
	const user = ref<User | null>(storedUser)

	const login = (logginUser: User) => {
		user.value = logginUser
		localStorage.setItem('jeffriuser', JSON.stringify(logginUser))
	}

	const logout = () => {
		user.value = null
		localStorage.removeItem('jeffriuser')
	}

	return {
		user,
		login,
		logout
	}
})
