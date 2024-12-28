import { DomainError } from '../../shared/domain/DomainError.js'

export class ModelConfigNotExistsDomainError extends DomainError {
	constructor(id: string) {
		super(`ModelConfig with id <<<${id}>>> not exists`)
	}
}
