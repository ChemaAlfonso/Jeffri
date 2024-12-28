import { User } from './User.js'
import { UserNotExistsDomainError } from './UserNotExistsDomainError.js'
import { UserRepository } from './UserRepository.js'

export class UserFinder {
	constructor(private readonly repository: UserRepository) {}

	async run(id: string): Promise<User> {
		const user = await this.repository.search(id)

		if (!user) {
			throw new UserNotExistsDomainError(id)
		}

		return user
	}
}
