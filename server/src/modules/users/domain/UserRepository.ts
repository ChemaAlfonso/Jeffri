import { User } from './User.js'

export interface UserRepository {
	save(user: User): Promise<void>
	search(id: string): Promise<User | null>
	searchByUsername(username: string): Promise<User | null>
	remove(id: string): Promise<void>
}
