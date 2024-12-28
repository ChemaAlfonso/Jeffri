import { DomainError } from '../../shared/domain/DomainError.js'

export class ContactNotExistsDomainError extends DomainError {
	constructor(id: string) {
		super(`Contact with id <<<${id}>>> not exists`)
	}
}
