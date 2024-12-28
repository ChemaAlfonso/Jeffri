import { DomainError } from '../../shared/domain/DomainError.js'

export class BotNotExistsDomainError extends DomainError {
	constructor(id: string) {
		super(`Bot with id <<<${id}>>> not exists`)
	}
}
