import { BOT_NAME } from '../../bots/domain/Bot.js'
import { Contact } from '../domain/Contact.js'
import { ContactFinder } from '../domain/ContactFinder.js'
import { ContactRepository } from '../domain/ContactRepository.js'

export class UpdateContact {
	constructor(private readonly repository: ContactRepository) {}

	async run(params: {
		id: string
		ownerId?: string
		name?: string
		avatar?: string
		botHandlers?: { [key in BOT_NAME]?: string }
		contexts?: string[]
	}): Promise<void> {
		const { id, ownerId, name, avatar, botHandlers, contexts } = params

		const finder = new ContactFinder(this.repository)
		const contact = await finder.run(id)

		const updatedData = {
			ownerId: ownerId || contact.ownerId,
			name: name || contact.name,
			avatar: avatar || contact.avatar,
			botHandlers: botHandlers || contact.botHandlers,
			contexts: contexts || contact.contexts,
			createdAt: contact.createdAt
		}

		const user = new Contact(
			id,
			updatedData.ownerId,
			updatedData.name,
			updatedData.avatar,
			updatedData.botHandlers,
			updatedData.contexts,
			updatedData.createdAt
		)
		await this.repository.save(user)
	}
}
