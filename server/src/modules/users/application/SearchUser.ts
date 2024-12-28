import { UserPrimitives } from '../domain/User.js'
import { UserRepository } from '../domain/UserRepository.js'

export class SearchUser {
	constructor(private readonly repository: UserRepository) {}

	async run(id: string): Promise<UserPrimitives | null> {
		const user = await this.repository.search(id)

		return user
	}
}
