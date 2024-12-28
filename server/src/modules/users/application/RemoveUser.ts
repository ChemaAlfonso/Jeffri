import { UserFinder } from '../domain/UserFinder.js'
import { UserRepository } from '../domain/UserRepository.js'

export class RemoveUser {
	constructor(private readonly repository: UserRepository) {}

	async run(id: string): Promise<void> {
		const finder = new UserFinder(this.repository)
		const user = await finder.run(id)

		await this.repository.remove(user.id)
	}
}
