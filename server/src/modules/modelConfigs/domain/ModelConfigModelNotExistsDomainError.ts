import { DomainError } from '../../shared/domain/DomainError.js'

export class ModelConfigModelNotExistsDomainError extends DomainError {
	constructor(name: string) {
		super(`Model with name <<<${name}>>> is not a valid model`)
	}
}
