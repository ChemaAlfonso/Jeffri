import type { BOT_NAME } from '@/modules/bots/Bot'

export interface Contact {
	id: string
	name: string
	avatar: string
	botHandlers: { [key in BOT_NAME]?: string }
	createdAt: number
	contexts: string[]
}
