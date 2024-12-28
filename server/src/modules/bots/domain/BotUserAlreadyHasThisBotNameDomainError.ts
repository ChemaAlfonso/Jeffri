import { DomainError } from '../../shared/domain/DomainError.js'

export class BotUserAlreadyHasThisBotNameDomainError extends DomainError {
	constructor(name: string) {
		super(`Bot with name <<<${name}>>> already exists for this user`)
	}
}
