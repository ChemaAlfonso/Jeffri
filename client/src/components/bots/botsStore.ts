// src/stores/chatsStore.ts
import type { Bot } from '@/modules/bots/Bot'
import { BOT_NAME } from '@/modules/bots/Bot'
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

const botIconByProvider = {
	[BOT_NAME.TELEGRAM]:
		'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/512px-Telegram_logo.svg.png',
	[BOT_NAME.WHATSAPP]: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/598px-WhatsApp.svg.png'
}

export const botsStore = defineStore('BotsStore', () => {
	const bots: Ref<Bot[]> = ref([])
	const notCreatedBotNames = ref<string[]>(Object.values(BOT_NAME))

	const saveBot = (newBot: Bot) => {
		newBot.icon = botIconByProvider[newBot.name]

		const existingBots = bots.value.find(contact => contact.id === newBot.id)
		if (existingBots) {
			Object.assign(existingBots, newBot)
			return
		}

		bots.value.push(newBot)
		notCreatedBotNames.value = notCreatedBotNames.value.filter(name => name !== newBot.name)
	}

	const removeBot = (id: string) => {
		const index = bots.value.findIndex(contact => contact.id === id)
		if (index === -1) return

		notCreatedBotNames.value.push(bots.value[index].name)
		bots.value.splice(index, 1)
	}

	const setBotStatus = (bot: Bot, status: 'connected' | 'disconnected') => {
		const updatedBotStatus = bots.value.map(b => {
			if (b.id === bot.id) {
				b.status = status
			}
			return b
		})

		bots.value = updatedBotStatus
	}

	const clearBots = () => {
		notCreatedBotNames.value = Object.values(BOT_NAME)
		bots.value = []
	}

	return {
		bots,
		notCreatedBotNames,
		saveBot,
		removeBot,
		clearBots,
		setBotStatus
	}
})
