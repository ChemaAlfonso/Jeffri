import { DomainError } from '../../shared/domain/DomainError.js'

export class UserAlreadyExistsDomainError extends DomainError {
	constructor(uniqueIdentifier: string) {
		super(`User <<<${uniqueIdentifier}>>> already exists`)
	}
}
