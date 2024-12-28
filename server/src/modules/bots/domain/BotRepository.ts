import { BOT_NAME, Bot } from './Bot.js'

export interface BotRepository {
	save(context: Bot): Promise<void>
	search(id: string): Promise<Bot | null>
	searchByName(ownerId: string, name: BOT_NAME): Promise<Bot | null>
	searchAll(ownerId: string): Promise<Bot[]>
	remove(id: string): Promise<void>
}
