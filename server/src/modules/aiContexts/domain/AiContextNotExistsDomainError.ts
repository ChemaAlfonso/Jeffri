import { DomainError } from '../../shared/domain/DomainError.js'

export class AiContextNotExistsDomainError extends DomainError {
	constructor(id: string) {
		super(`AiContext with id <<<${id}>>> not exists`)
	}
}
