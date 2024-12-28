import { DomainError } from '../../shared/domain/DomainError.js'

export class AiContextAlreadyExistsDomainError extends DomainError {
	constructor(id: string) {
		super(`AiContext with id <<<${id}>>> already exists`)
	}
}
