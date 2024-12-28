import bcrypt from 'bcryptjs'
import { PasswordHasher } from '../domain/PasswordHasher.js'

export class BcryptPasswordHasher implements PasswordHasher {
	async hash(password: string) {
		const salt = await bcrypt.genSalt(10)
		return bcrypt.hashSync(password, salt)
	}

	async verify(password: string, hash: string) {
		return bcrypt.compareSync(password, hash)
	}
}
