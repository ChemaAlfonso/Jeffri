import { SessionPrimitives } from '../domain/User.js'
import { UserFinder } from '../domain/UserFinder.js'
import { UserRepository } from '../domain/UserRepository.js'
import { UserSessionNotExistsDomainError } from '../domain/UserSessionNotExistsDomainError.js'

export class SearchSession {
	constructor(private readonly repository: UserRepository) {}

	async run(params: { userId: string; refreshToken: string }): Promise<SessionPrimitives> {
		const { userId, refreshToken } = params

		const finder = new UserFinder(this.repository)

		const existingUser = await finder.run(userId)

		const searchingSession = existingUser.sessions.find(session => session.refreshToken === refreshToken)

		if (!searchingSession) throw new UserSessionNotExistsDomainError(userId)

		return searchingSession
	}
}
