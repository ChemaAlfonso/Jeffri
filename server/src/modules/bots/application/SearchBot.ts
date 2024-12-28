import { BotPrimitives } from '../domain/Bot.js'
import { BotRepository } from '../domain/BotRepository.js'

export class SearchBot {
	constructor(private readonly repository: BotRepository) {}

	async run(id: string): Promise<BotPrimitives | null> {
		const bot = await this.repository.search(id)
		return bot?.toPrimitives() ?? null
	}
}
