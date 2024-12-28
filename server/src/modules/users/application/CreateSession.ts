import { SessionPrimitives, User } from '../domain/User.js'
import { UserFinder } from '../domain/UserFinder.js'
import { UserRepository } from '../domain/UserRepository.js'

export class CreateSession {
	constructor(private readonly repository: UserRepository) {}

	async run(params: { userId: string; session: SessionPrimitives }): Promise<void> {
		const { userId, session } = params

		const finder = new UserFinder(this.repository)

		const existingUser = await finder.run(userId)

		const updatedUser = existingUser.createSession(session)

		await this.repository.save(updatedUser)
	}
}
