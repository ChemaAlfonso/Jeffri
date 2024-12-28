<template>
	<div v-if="telegramData.otpRequesting">
		<span class="text-surface-500 dark:text-surface-400 block mb-8">{{ getText('OTP code') }}</span>
		<div class="mb-8 flex items-center justify-center">
			<InputMask
				v-if="telegramData.otpRequesting"
				id="basic"
				class="w-20 text-center"
				v-model="otp"
				mask="99999"
				placeholder="99999"
			/>
		</div>
	</div>

	<div v-else-if="telegramData.passwordRequesting">
		<span class="text-surface-500 dark:text-surface-400 block mb-8">{{ getText('Telegram password') }}</span>
		<div class="mb-8 flex items-center justify-center">
			<Password id="basic" class="w-full" :feedback="false" v-model="password" />
		</div>
	</div>

	<div v-else-if="telegramData.failed">
		<span class="text-surface-500 dark:text-surface-400 block mb-8">{{
			getText('Cannot login to Telegram, please retry...')
		}}</span>
	</div>

	<div v-else class="flex items-center justify-center mb-8">
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
			class="animate-spin"
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
	</div>

	<div class="flex justify-end gap-2">
		<Button type="button" :label="getText('Cancel')" severity="secondary" @click="cancel"></Button>
		<Button v-if="!telegramData.failed" type="button" :label="getText('Confirm')" @click="submit"></Button>
	</div>
</template>

<script setup lang="ts">
import { useBotLogin } from '@/components/bots/logins/useBotLogin'
import Button from 'primevue/button'
import { getText } from '@/lang/getText'
import InputMask from 'primevue/inputmask'
import Password from 'primevue/password'
import { ref, watch } from 'vue'
import { BOT_NAME } from '@/modules/bots/Bot'

const { telegramData, resetTelegramLogin, sendTelegramOtp, sendTelegramPassword } = useBotLogin()

const emit = defineEmits(['cancel', 'done'])

const cancel = () => {
	resetTelegramLogin()
	emit('cancel', BOT_NAME.TELEGRAM)
}

// ===================================
// OTP
// ===================================
const otp = ref()
const submitOtp = () => {
	if (!otp.value) return
	sendTelegramOtp(otp.value)
}

// ===================================
// Password
// ===================================
const password = ref()
const submitPassword = () => {
	if (!password.value) return
	sendTelegramPassword(password.value)
}

const submit = () => {
	if (telegramData.value.otpRequesting) {
		submitOtp()
	} else if (telegramData.value.passwordRequesting) {
		submitPassword()
	}
}

watch(
	() => telegramData.value.isLoggingIn,
	isLoggingIn => {
		if (!isLoggingIn) emit('done')
	}
)
</script>
