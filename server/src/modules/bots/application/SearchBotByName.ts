import { BOT_NAME, BotPrimitives } from '../domain/Bot.js'
import { BotRepository } from '../domain/BotRepository.js'

export class SearchBotByName {
	constructor(private readonly repository: BotRepository) {}

	async run(ownerId: string, name: BOT_NAME): Promise<BotPrimitives | null> {
		return await this.repository.searchByName(ownerId, name)
	}
}
