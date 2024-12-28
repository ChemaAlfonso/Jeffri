import { SessionPrimitives, User } from '../domain/User.js'
import { UserFinder } from '../domain/UserFinder.js'
import { UserRepository } from '../domain/UserRepository.js'
import { UserSessionNotExistsDomainError } from '../domain/UserSessionNotExistsDomainError.js'

export class RefreshSession {
	constructor(private readonly repository: UserRepository) {}

	async run(params: { userId: string; oldrefreshToken: string; session: SessionPrimitives }): Promise<void> {
		const { userId, oldrefreshToken, session } = params

		const finder = new UserFinder(this.repository)

		const existingUser = await finder.run(userId)

		const sessionExists = existingUser.sessionExists(oldrefreshToken)

		if (!sessionExists) throw new UserSessionNotExistsDomainError(userId)

		const updatedUser = existingUser.refreshSession(oldrefreshToken, session)

		await this.repository.save(updatedUser)
	}
}
