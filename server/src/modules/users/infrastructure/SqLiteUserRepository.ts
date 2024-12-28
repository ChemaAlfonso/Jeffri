import { User } from '../domain/User.js'
import { UserRepository } from '../domain/UserRepository.js'
import { SQLiteDb } from '../../shared/infrastructure/SQLiteDb.js'

interface UserSchema {
	id: string
	name: string
	email: string
	phone: string
	password: string
	sessions: string
	createdAt: number
}
export class SQLiteUserRepository implements UserRepository {
	private tableName = 'users'

	constructor(private readonly db: SQLiteDb) {}

	async save(user: User): Promise<void> {
		const userPrimitives = {
			...user.toPrimitives(),
			sessions: JSON.stringify(user.sessions)
		}

		await this.db.upsert('users', userPrimitives, user.id)
	}

	async search(id: string): Promise<User | null> {
		const row = await this.db.get<UserSchema>(this.tableName, { id })

		if (!row) return null

		return User.fromPrimitives({
			...row,
			sessions: JSON.parse(row.sessions || '[]')
		})
	}

	async searchByUsername(username: string): Promise<User | null> {
		const row = await this.db.get<UserSchema>(this.tableName, { email: username })

		if (!row) return null

		return User.fromPrimitives({
			...row,
			sessions: JSON.parse(row.sessions || '[]')
		})
	}

	async remove(id: string): Promise<void> {
		await this.db.remove(this.tableName, { id })
	}
}
