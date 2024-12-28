import { DomainError } from '../../shared/domain/DomainError.js'

export class BotOwnerHasNoModelConfigExistsDomainError extends DomainError {
	constructor(ownerId: string) {
		super(`The bot owner with id <<<${ownerId}>>> has no model config`)
	}
}
