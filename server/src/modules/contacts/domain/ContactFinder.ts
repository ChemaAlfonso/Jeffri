import { Contact } from './Contact.js'
import { ContactNotExistsDomainError } from './ContactNotExistsDomainError.js'
import { ContactRepository } from './ContactRepository.js'

export class ContactFinder {
	constructor(private readonly repository: ContactRepository) {}

	async run(id: string): Promise<Contact> {
		const contact = await this.repository.search(id)

		if (!contact) {
			throw new ContactNotExistsDomainError(id)
		}

		return contact
	}
}
