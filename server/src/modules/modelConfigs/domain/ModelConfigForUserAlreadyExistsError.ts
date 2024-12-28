import { DomainError } from '../../shared/domain/DomainError.js'

export class ModelConfigForUserAlreadyExistsError extends DomainError {
	constructor(id: string, userId: string) {
		super(`<<<${userId}>>> has already a model config with id <<<${id}>>>`)
	}
}
