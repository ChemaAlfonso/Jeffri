<template>
	<div class="flex flex-col justify-center items-center h-dvh">
		<div class="fixed top-0 right-0 p-3">
			<DarkMode />
		</div>
		<Card class="block w-[95dvw] md:w-1/2 mx-auto p-6 rounded-md">
			<template #content>
				<form v-if="!hasLogedIn" ref="form" @submit="submitLogin">
					<h1 class="text-xl font-semibold mb-8">Jeffri</h1>
					<div class="mb-5">
						<label class="block text-sm mb-2" for="username">{{ getText('Username') }}</label>
						<InputText
							:placeholder="getText('Username')"
							v-model="username"
							type="email"
							required
							class="w-full"
						/>
					</div>
					<div class="mb-5">
						<label class="block text-sm mb-2" for="password">{{ getText('Password') }}</label>
						<Password
							:placeholder="getText('***********')"
							:feedback="false"
							v-model="password"
							id="password"
							required
							class="w-full"
						/>
					</div>
					<div class="mb-5 text-red-500" v-if="error">{{ error }}</div>
					<div class="flex items-center justify-end">
						<router-link :to="'/register'" class="rounded-md p-2 px-3">
							{{ getText('Sign up') }}
						</router-link>
						<Button severity="success" type="submit" :label="getText('Login')" />
					</div>
				</form>
				<div class="flex flex-col items-center gap-5" v-else>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="animate-spin my-12"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<path d="M12 6l0 -3" />
						<path d="M16.25 7.75l2.15 -2.15" />
						<path d="M18 12l3 0" />
						<path d="M16.25 16.25l2.15 2.15" />
						<path d="M12 18l0 3" />
						<path d="M7.75 16.25l-2.15 2.15" />
						<path d="M6 12l-3 0" />
						<path d="M7.75 7.75l-2.15 -2.15" />
					</svg>
					<div class="flex justify-end items-center w-full">
						<Button severity="danger" @click="logout" type="button" :label="getText('Cancel')" />
					</div>
				</div>
			</template>
		</Card>
	</div>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import { useUser } from '@/components/users/useUser'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getText } from '@/lang/getText'
import DarkMode from '@/components/layout/DarkMode.vue'

const { loginUser, logoutUser, user } = useUser()
const router = useRouter()

const form = ref<HTMLFormElement | undefined>()
const username = ref('')
const password = ref('')
const error = ref('')
const hasLogedIn = ref(Boolean(user.value))
const isLoading = ref(false)

const submitLogin = async (e: Event) => {
	e.preventDefault()

	error.value = ''

	if (!form.value) return

	if (!form.value.checkValidity()) return

	try {
		isLoading.value = true
		await loginUser(username.value, password.value)

		form.value.reset()
		hasLogedIn.value = true
		router.push('/')
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'No se pudo iniciar sesión'
		error.value = errorMessage
	}
	isLoading.value = false
}

const logout = async () => {
	logoutUser()
	hasLogedIn.value = false
	isLoading.value = false
}

onMounted(async () => {
	if (user.value) {
		router.push('/')
	}
})
</script>
