import { Primitivable } from '../../shared/domain/Primitivable.js'
export interface SessionPrimitives {
	ip: string
	device: string
	userAgent: string
	refreshToken: string
	expiresAt: number
	createdAt: number
}
export interface UserPrimitives {
	id: string
	name: string
	email: string
	phone: string
	password: string
	sessions: SessionPrimitives[]
	createdAt: number
}

export class User extends Primitivable<UserPrimitives> {
	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly email: string,
		public readonly phone: string,
		public readonly password: string,
		public readonly sessions: SessionPrimitives[],
		public readonly createdAt: number
	) {
		super()
	}

	toPrimitives(): UserPrimitives {
		return {
			id: this.id,
			name: this.name,
			email: this.email,
			phone: this.phone,
			password: this.password,
			sessions: this.sessions,
			createdAt: this.createdAt
		}
	}

	sessionExists(refreshToken: string): boolean {
		return this.sessions.some(session => session.refreshToken === refreshToken)
	}

	createSession(session: SessionPrimitives): User {
		return User.fromPrimitives({
			...this.toPrimitives(),
			sessions: [...this.sessions, session]
		})
	}

	refreshSession(refreshToken: string, newSession: SessionPrimitives): User {
		return User.fromPrimitives({
			...this.toPrimitives(),
			sessions: this.sessions.map(session => (session.refreshToken === refreshToken ? newSession : session))
		})
	}

	removeSession(refreshToken: string): User {
		return User.fromPrimitives({
			...this.toPrimitives(),
			sessions: this.sessions.filter(session => session.refreshToken !== refreshToken)
		})
	}

	clearExpiredSessions(): User {
		return User.fromPrimitives({
			...this.toPrimitives(),
			sessions: this.sessions.filter(session => session.expiresAt > Date.now())
		})
	}

	clearSessions(): User {
		return User.fromPrimitives({
			...this.toPrimitives(),
			sessions: []
		})
	}

	static fromPrimitives(primitives: UserPrimitives): User {
		return new User(
			primitives.id,
			primitives.name,
			primitives.email,
			primitives.phone,
			primitives.password,
			primitives.sessions,
			primitives.createdAt
		)
	}
}
