import { UserFinder } from '../domain/UserFinder.js'
import { UserRepository } from '../domain/UserRepository.js'
import { UserSessionNotExistsDomainError } from '../domain/UserSessionNotExistsDomainError.js'

export class CloseSession {
	constructor(private readonly repository: UserRepository) {}

	async run(params: { userId: string; refreshToken: string }): Promise<void> {
		const { userId, refreshToken } = params

		const finder = new UserFinder(this.repository)

		const existingUser = await finder.run(userId)

		const sessionExists = existingUser.sessionExists(refreshToken)

		if (!sessionExists) throw new UserSessionNotExistsDomainError(userId)

		const updatedUser = existingUser.removeSession(refreshToken)

		await this.repository.save(updatedUser)
	}
}
