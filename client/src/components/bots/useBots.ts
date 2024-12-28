import { useUser } from '@/components/users/useUser'
import type { Bot } from '@/modules/bots/Bot'
import { useApi } from '@/modules/connection/Api'
import { BOT_NAME, BOT_STATUS } from '@/modules/bots/Bot'
import { botsStore } from '@/components/bots/botsStore'
import { storeToRefs } from 'pinia'
import { v4 } from 'uuid'

export const useBots = () => {
	const { user } = useUser()
	const {
		startBot,
		stopBot,
		logoutBot,
		getBotStatus,
		getBots,
		saveBot: saveBotOnServer,
		removeBot: removeBotOnServer
	} = useApi()
	const { bots, notCreatedBotNames } = storeToRefs(botsStore())
	const { saveBot, removeBot, clearBots, setBotStatus } = botsStore()

	// ===================================
	// Connections
	// ===================================
	const turnOn = async (bot: Bot) => {
		await startBot(bot)
	}

	const turnOff = async (bot: Bot) => {
		await stopBot(bot)
	}

	const logout = async (bot: Bot) => {
		try {
			const confirmRemove = confirm(
				'Are you sure you want to logout? You will need to login again to use this bot.'
			)

			if (!confirmRemove) return

			await logoutBot(bot)
		} catch (error) {
			console.error('Error login out', error)
		}
	}

	// ===================================
	// Data retrieval
	// ===================================
	const checkStatus = async (bot: Bot) => {
		try {
			const status = await getBotStatus(bot)
			setBotStatus(bot, status)
		} catch (error) {
			setBotStatus(bot, BOT_STATUS.DISCONNECTED)
		}
	}

	const getAll = async () => {
		clearBots()
		const fetchedBots = await getBots()
		fetchedBots.forEach(bot => {
			saveBot(bot)
		})

		return bots.value
	}

	const botWithName = (name: BOT_NAME) => {
		return bots.value.find(bot => bot.name === name)
	}

	// ===================================
	// Persistence
	// ===================================
	const save = async (params: {
		id?: string
		ownerId: string
		name: BOT_NAME
		enabled: boolean
		whitelist: string[]
		blacklist: string[]
		createdAt?: number
	}) => {
		const bot: Bot = {
			...params,
			id: params.id || v4(),
			ownerId: params.ownerId,
			name: params.name,
			enabled: params.enabled,
			whitelist: params.whitelist,
			blacklist: params.blacklist,
			createdAt: params.createdAt || new Date().getTime()
		}

		await saveBotOnServer(bot)
		saveBot({ ...bot, status: 'disconnected' })
	}

	const saveForName = async (botName: string) => {
		if (!user.value?.id) {
			console.error('User not found')
			return
		}

		await save({
			id: v4(),
			ownerId: user.value.id,
			name: botName as BOT_NAME,
			enabled: true,
			whitelist: [],
			blacklist: []
		})
	}

	const remove = async (bot: Bot) => {
		const confirmRemove = confirm('Are you sure you want to remove this bot? All configurations will be lost.')

		if (!confirmRemove) return

		try {
			await stopBot(bot)
			await removeBotOnServer(bot.id)
			removeBot(bot.id)
		} catch (error) {
			console.error('Error disconnecting bot', error)
		}
	}

	return {
		bots,
		notCreatedBotNames,
		botWithName,

		turnOn,
		turnOff,
		logout,
		checkStatus,

		getAll,
		save,
		remove,
		saveForName
	}
}
