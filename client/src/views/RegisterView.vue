<template>
	<div class="flex flex-col justify-center items-center h-dvh">
		<div class="fixed top-0 right-0 p-3">
			<DarkMode />
		</div>
		<Card class="block w-[95dvw] md:w-1/2 mx-auto p-6 rounded-md">
			<template #content>
				<form ref="form" @submit="submitRegister">
					<h1 class="text-xl font-semibold mb-8">Jeffri</h1>

					<div class="mb-5">
						<label class="block text-sm mb-2" for="name">{{ getText('Name') }}</label>
						<InputText :placeholder="getText('Jeffri')" v-model="name" id="name" required class="w-full" />
					</div>

					<div class="flex items-center justify-start gap-2">
						<div class="mb-5 flex-grow-0 w-24">
							<label class="block text-sm mb-2" for="phonePrefix">{{ getText('Prefix') }}</label>
							<InputText
								class="w-full"
								:placeholder="getText('34')"
								v-model="phonePrefix"
								id="phonePrefix"
								required
							/>
						</div>
						<div class="mb-5 flex-grow w-full">
							<label class="block text-sm mb-2" for="phone">{{ getText('Phone') }}</label>
							<InputText
								required
								class="w-full"
								v-model="phone"
								id="phone"
								:placeholder="getText('123456789')"
							/>
						</div>
					</div>

					<div class="mb-5">
						<label class="block text-sm mb-2" for="username">{{ getText('Email') }}</label>
						<InputText
							:placeholder="'jeffri@Jeffri.com'"
							v-model="username"
							id="username"
							type="email"
							required
							class="w-full"
						/>
					</div>

					<div class="mb-5">
						<label class="block text-sm mb-2" for="password">Contraseña</label>
						<Password
							:placeholder="getText('***********')"
							:feedback="true"
							v-model="password"
							id="password"
							required
							class="w-full"
						/>
					</div>

					<div class="mb-5">
						<label class="block text-sm mb-2" for="passwordRepeat">Repite la contraseña</label>
						<Password
							:placeholder="getText('***********')"
							:feedback="false"
							v-model="passwordRepeat"
							id="passwordRepeat"
							required
							class="w-full"
						/>
					</div>

					<div class="mb-5 text-red-500" v-if="error">{{ error }}</div>
					<div class="flex items-center justify-end">
						<router-link :to="'/login'" class="rounded-md p-2 px-3">
							{{ getText('Sign in') }}
						</router-link>

						<Button severity="success" type="submit" :label="getText('Sign up')" />
					</div>
				</form>
			</template>
		</Card>
	</div>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Password from 'primevue/password'
import DarkMode from '@/components/layout/DarkMode.vue'
import { useUser } from '@/components/users/useUser'
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getText } from '@/lang/getText'

const { createUser } = useUser()
const router = useRouter()

const form = ref<HTMLFormElement | undefined>()
const name = ref('')
const username = ref('')
const password = ref('')
const passwordRepeat = ref('')
const phonePrefix = ref('')
const phone = ref('')
const error = ref('')
const isLoading = ref(false)

const phonePrefixIsValid = () => {
	const prefixRegex = /^\d{1,3}$/
	const prefixIsValid = phonePrefix.value.length > 0 && prefixRegex.test(phonePrefix.value)

	if (!prefixIsValid) error.value = 'El prefijo del teléfono no es válido'

	return prefixIsValid
}

const phoneIsValid = () => {
	const phoneRegex = /^\d{9,14}$/
	const numberIsValid = phone.value.length > 0 && !isNaN(Number(phone.value)) && phoneRegex.test(phone.value)

	if (!numberIsValid) error.value = 'El número de teléfono no es válido'

	return numberIsValid
}

const emailIsValid = () => {
	const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
	const emailIsValid = emailRegex.test(username.value)

	if (!emailIsValid) error.value = 'El email no es válido'

	return emailIsValid
}

const nameIsValid = () => {
	const nameRegex = /^[a-zA-Z\s]{3,50}$/
	const nameIsValid = nameRegex.test(name.value)

	if (!nameIsValid) error.value = 'El nombre no es válido'

	return nameIsValid
}

const submitRegister = async (e: Event) => {
	e.preventDefault()

	error.value = ''

	if (!form.value) return

	if (!form.value.checkValidity()) return

	if (!nameIsValid() || !phonePrefixIsValid() || !phoneIsValid() || !emailIsValid()) return

	if (password.value !== passwordRepeat.value) {
		error.value = 'Las contraseñas no coinciden'
		return
	}

	try {
		isLoading.value = true
		await createUser({
			name: name.value,
			email: username.value,
			password: password.value,
			phone: phone.value,
			prefix: phonePrefix.value
		})

		form.value.reset()
		router.push('/login')
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'No se pudo crear el usuario'
		error.value = errorMessage
	}
}
</script>
