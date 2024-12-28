import { ContactPrimitives } from '../domain/Contact.js'
import { ContactRepository } from '../domain/ContactRepository.js'

export class SearchAllContacts {
	constructor(private readonly repository: ContactRepository) {}

	async run(ownerId: string): Promise<ContactPrimitives[]> {
		const contact = await this.repository.searchAll(ownerId)
		return contact.map(contact => contact.toPrimitives())
	}
}
