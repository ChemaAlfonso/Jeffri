import { Bot } from './Bot.js'
import { BotNotExistsDomainError } from './BotNotExistsDomainError.js'
import { BotRepository } from './BotRepository.js'

export class BotFinder {
	constructor(private readonly repository: BotRepository) {}

	async run(id: string): Promise<Bot> {
		const contact = await this.repository.search(id)

		if (!contact) {
			throw new BotNotExistsDomainError(id)
		}

		return contact
	}
}
