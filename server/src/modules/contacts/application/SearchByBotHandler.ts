import { BOT_NAME } from '../../bots/domain/Bot.js'
import { ContactPrimitives } from '../domain/Contact.js'
import { ContactRepository } from '../domain/ContactRepository.js'

export class SearchByBotHandler {
	constructor(private readonly repository: ContactRepository) {}

	async run(ownerId: string, botName: BOT_NAME, handler: string): Promise<ContactPrimitives | null> {
		const contact = await this.repository.searchByBotHandler(ownerId, botName, handler)
		return contact?.toPrimitives() ?? null
	}
}
