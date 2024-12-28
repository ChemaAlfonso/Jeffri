import { DomainError } from './DomainError.js'

export class UnprocesableError extends DomainError {
	constructor() {
		super(`Your request could not be processed`)
	}
}
