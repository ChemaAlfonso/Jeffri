import { BOT_NAME, Bot } from '../domain/Bot.js'
import { BotRepository } from '../domain/BotRepository.js'

export class CreateBot {
	constructor(private readonly repository: BotRepository) {}

	async run(params: {
		id: string
		ownerId: string
		name: BOT_NAME
		enabled: boolean
		whitelist: string[]
		blacklist: string[]
		createdAt: number
	}): Promise<void> {
		const { id, ownerId, name, enabled, whitelist, blacklist, createdAt } = params

		await this.repository.save(new Bot(id, ownerId, name, enabled, whitelist, blacklist, createdAt))
	}
}
