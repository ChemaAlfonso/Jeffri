import { BotPrimitives } from '../domain/Bot.js'
import { BotRepository } from '../domain/BotRepository.js'

export class SearchAllBots {
	constructor(private readonly repository: BotRepository) {}

	async run(ownerId: string): Promise<BotPrimitives[]> {
		const bots = await this.repository.searchAll(ownerId)
		return bots.map(bots => bots.toPrimitives())
	}
}
