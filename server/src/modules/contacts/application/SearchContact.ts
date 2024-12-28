import { Contact, ContactPrimitives } from '../domain/Contact.js'
import { ContactRepository } from '../domain/ContactRepository.js'

export class SearchContact {
	constructor(private readonly repository: ContactRepository) {}

	async run(id: string): Promise<ContactPrimitives | null> {
		const contact = await this.repository.search(id)
		return contact?.toPrimitives() ?? null
	}
}
