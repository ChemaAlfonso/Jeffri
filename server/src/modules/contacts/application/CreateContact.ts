import { BOT_NAME } from '../../bots/domain/Bot.js'
import { Contact } from '../domain/Contact.js'
import { ContactRepository } from '../domain/ContactRepository.js'

export class CreateContact {
	constructor(private readonly repository: ContactRepository) {}

	async run(params: {
		id: string
		ownerId: string
		name: string
		avatar: string
		botHandlers: { [key in BOT_NAME]?: string }
		contexts: string[]
		createdAt: number
	}): Promise<void> {
		const { id, ownerId, name, avatar, botHandlers, contexts, createdAt } = params
		const user = new Contact(id, ownerId, name, avatar, botHandlers, contexts, createdAt)
		await this.repository.save(user)
	}
}
