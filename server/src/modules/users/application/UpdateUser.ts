import { User } from '../domain/User.js'
import { UserFinder } from '../domain/UserFinder.js'
import { UserRepository } from '../domain/UserRepository.js'

export class UpdateUser {
	constructor(private readonly repository: UserRepository) {}

	async run(params: { id: string; name?: string; email?: string; phone?: string; password?: string }): Promise<void> {
		const { id, name, email, phone, password } = params

		const finder = new UserFinder(this.repository)
		const existingUser = await finder.run(id)

		const updatedData = {
			name: name || existingUser.name,
			email: email || existingUser.email,
			phone: phone || existingUser.phone,
			password: password || existingUser.password,
			sessions: existingUser.sessions,
			createdAt: existingUser.createdAt
		}

		const user = new User(
			id,
			updatedData.name,
			updatedData.email,
			updatedData.phone,
			updatedData.password,
			updatedData.sessions,
			updatedData.createdAt
		)

		await this.repository.save(user)
	}
}
