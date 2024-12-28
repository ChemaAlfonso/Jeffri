import { SessionPrimitives, User } from '../domain/User.js'
import { UserAlreadyExistsDomainError } from '../domain/UserAlreadyExistsDomainError.js'
import { UserRepository } from '../domain/UserRepository.js'

export class CreateUser {
	constructor(private readonly repository: UserRepository) {}

	async run(
		id: string,
		name: string,
		email: string,
		phone: string,
		password: string,
		sessions: SessionPrimitives[],
		createdAt: number
	): Promise<void> {
		const existingUser = await this.repository.search(id)
		if (existingUser) {
			throw new UserAlreadyExistsDomainError(id)
		}

		const existingByUsername = await this.repository.searchByUsername(email)
		if (existingByUsername) {
			throw new UserAlreadyExistsDomainError(email)
		}

		const user = new User(id, name, email, phone, password, sessions, createdAt)
		await this.repository.save(user)
	}
}
