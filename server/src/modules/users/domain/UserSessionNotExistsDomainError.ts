import { DomainError } from '../../shared/domain/DomainError.js'

export class UserSessionNotExistsDomainError extends DomainError {
	constructor(userId: string) {
		super(`The session not exists for user with id <<<${userId}>>>`)
	}
}
