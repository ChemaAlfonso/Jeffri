import type { BOT_NAME } from '@/modules/bots/Bot'

export interface AiContext {
	id: string
	name: string
	content: string
	enabledInBots: BOT_NAME[]
	exclusive: boolean
	enabled: boolean
	createdAt: number
}
