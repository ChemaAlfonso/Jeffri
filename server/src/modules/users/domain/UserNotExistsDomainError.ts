import { DomainError } from '../../shared/domain/DomainError.js'

export class UserNotExistsDomainError extends DomainError {
	constructor(id: string) {
		super(`User with id <<<${id}>>> not exists`)
	}
}
