// src/stores/chatsStore.ts
import type { Bot } from '@/modules/bots/Bot'
import { BOT_NAME } from '@/modules/bots/Bot'
import { defineStore } from 'pinia'
import { computed, ref, type Ref } from 'vue'

interface BotLoginData {
	[BOT_NAME.TELEGRAM]: {
		isLoggingIn: boolean
		passwordRequesting: boolean
		otpRequesting: boolean
		failed: boolean
	}
	[BOT_NAME.WHATSAPP]: {
		isLoggingIn: boolean
		qr: string | undefined
		failed: boolean
	}
}

export const botsLoginStore = defineStore('BotsLoginStore', () => {
	const telegramData: Ref<BotLoginData[BOT_NAME.TELEGRAM]> = ref({
		passwordRequesting: false,
		otpRequesting: false,
		isLoggingIn: false,
		failed: false
	})

	const whatsappData: Ref<BotLoginData[BOT_NAME.WHATSAPP]> = ref({
		qr: undefined,
		isLoggingIn: false,
		failed: false
	})

	const setTelegramData = (newData: BotLoginData[typeof BOT_NAME.TELEGRAM]) => {
		telegramData.value.isLoggingIn = newData.isLoggingIn
		telegramData.value.otpRequesting = newData.otpRequesting
		telegramData.value.passwordRequesting = newData.passwordRequesting
		telegramData.value.failed = newData.failed
	}

	const setWhatsappData = (newData: BotLoginData[typeof BOT_NAME.WHATSAPP]) => {
		whatsappData.value.qr = newData.qr
		whatsappData.value.isLoggingIn = newData.isLoggingIn
		whatsappData.value.failed = newData.failed
	}

	const telegramLoginRequiresAttention = computed(() => {
		return telegramData.value.isLoggingIn
	})

	const whatsappLoginRequiresAttention = computed(() => {
		return whatsappData.value.isLoggingIn
	})

	const loginRequiresAttention = computed(() => {
		return telegramLoginRequiresAttention.value || whatsappLoginRequiresAttention.value
	})

	return {
		telegramLoginRequiresAttention,
		whatsappLoginRequiresAttention,
		loginRequiresAttention,
		telegramData,
		setTelegramData,
		whatsappData,
		setWhatsappData
	}
})
