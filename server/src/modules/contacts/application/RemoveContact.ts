import { ContactFinder } from '../domain/ContactFinder.js'
import { ContactRepository } from '../domain/ContactRepository.js'

export class RemoveContact {
	constructor(private readonly repository: ContactRepository) {}

	async run(id: string): Promise<void> {
		const finder = new ContactFinder(this.repository)
		const user = await finder.run(id)

		await this.repository.remove(user.id)
	}
}
