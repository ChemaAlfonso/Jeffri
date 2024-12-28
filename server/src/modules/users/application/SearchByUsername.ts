import { UserPrimitives } from '../domain/User.js'
import { UserRepository } from '../domain/UserRepository.js'

export class SearchByUsername {
	constructor(private readonly repository: UserRepository) {}

	async run(username: string): Promise<UserPrimitives | null> {
		const user = await this.repository.searchByUsername(username)

		return user
	}
}
