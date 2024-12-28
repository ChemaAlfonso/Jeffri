import { botsLoginStore } from '@/components/bots/logins/botsLoginStore'
import { useBots } from '@/components/bots/useBots'
import { useSocket } from '@/components/shared/useSocket'
import { BOT_NAME } from '@/modules/bots/Bot'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const logedEventsEnabled = ref(false)

export const useBotLogin = () => {
	const {
		loginRequiresAttention,
		telegramLoginRequiresAttention,
		whatsappLoginRequiresAttention,
		whatsappData,
		telegramData
	} = storeToRefs(botsLoginStore())
	const { setTelegramData, setWhatsappData } = botsLoginStore()
	const { on, emit } = useSocket()
	const { botWithName, checkStatus } = useBots()

	// ===================================
	// WhatsApp
	// ===================================
	const resetWhatsappLogin = () => {
		setWhatsappData({
			qr: undefined,
			isLoggingIn: false,
			failed: false
		})
	}

	const whatsappSocketEvents = () => {
		on('whatsapp:qr', qr => {
			setWhatsappData({
				qr,
				isLoggingIn: true,
				failed: false
			})
		})

		on('whatsapp:ready', async () => {
			setWhatsappData({
				qr: undefined,
				isLoggingIn: false,
				failed: false
			})

			const bot = botWithName(BOT_NAME.WHATSAPP)
			if (bot) await checkStatus(bot)
		})

		on('whatsapp:closedconnection', async () => {
			setWhatsappData({
				...whatsappData.value,
				qr: undefined,
				failed: true
			})

			const bot = botWithName(BOT_NAME.WHATSAPP)
			if (bot) await checkStatus(bot)
		})
	}

	// ===================================
	// Telegram
	// ===================================
	const resetTelegramLogin = () => {
		setTelegramData({
			passwordRequesting: false,
			otpRequesting: false,
			isLoggingIn: false,
			failed: false
		})
	}

	const sendTelegramPassword = async (password: string) => {
		emit('telegram:password:set', password)
		setTelegramData({
			passwordRequesting: false,
			isLoggingIn: true,
			otpRequesting: false,
			failed: false
		})
	}

	const sendTelegramOtp = async (otp: string) => {
		emit('telegram:otp:set', otp)
		setTelegramData({
			passwordRequesting: false,
			otpRequesting: false,
			isLoggingIn: true,
			failed: false
		})
	}

	const telegramSocketEvents = () => {
		on('telegram:password:request', async _ => {
			setTelegramData({
				passwordRequesting: true,
				otpRequesting: false,
				failed: false,
				isLoggingIn: true
			})
		})

		on('telegram:otp:request', async _ => {
			setTelegramData({
				passwordRequesting: false,
				otpRequesting: true,
				isLoggingIn: true,
				failed: false
			})
		})

		on('telegram:ready', async () => {
			setTelegramData({
				passwordRequesting: false,
				otpRequesting: false,
				isLoggingIn: false,
				failed: false
			})

			const bot = botWithName(BOT_NAME.TELEGRAM)
			if (bot) await checkStatus(bot)
		})

		on('telegram:failed', () => {
			setTelegramData({
				passwordRequesting: false,
				otpRequesting: false,
				isLoggingIn: false,
				failed: true
			})
		})

		on('telegram:disconected', async () => {
			setTelegramData({
				passwordRequesting: false,
				otpRequesting: false,
				isLoggingIn: false,
				failed: false
			})

			const bot = botWithName(BOT_NAME.TELEGRAM)
			if (bot) await checkStatus(bot)
		})
	}

	const enableSocketEvents = () => {
		if (logedEventsEnabled.value) return
		logedEventsEnabled.value = true
		whatsappSocketEvents()
		telegramSocketEvents()
	}
	enableSocketEvents()

	return {
		loginRequiresAttention,

		// WhatsApp
		whatsappLoginRequiresAttention,
		resetWhatsappLogin,
		whatsappData,

		// Telegram
		telegramLoginRequiresAttention,
		telegramData,
		sendTelegramPassword,
		sendTelegramOtp,
		resetTelegramLogin
	}
}
