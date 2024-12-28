import { UserFinder } from '../domain/UserFinder.js'
import { UserRepository } from '../domain/UserRepository.js'

export class ClearExpiredSessions {
	constructor(private readonly repository: UserRepository) {}

	async run(params: { userId: string }): Promise<void> {
		const { userId } = params

		const finder = new UserFinder(this.repository)
		const user = await finder.run(userId)

		const updatedUser = user.clearExpiredSessions()

		await this.repository.save(updatedUser)
	}
}
