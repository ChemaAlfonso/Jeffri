import { UserRepository } from '../domain/UserRepository.js'

export class LoginUser {
	constructor(private readonly repository: UserRepository) {}

	async run(username: string, password: string): Promise<void> {
		const user = await this.repository.searchByUsername(username)

		if (!user) {
			throw new Error('User not found')
		}

		if (user.password !== password) {
			throw new Error('Invalid credentials')
		}
	}
}
