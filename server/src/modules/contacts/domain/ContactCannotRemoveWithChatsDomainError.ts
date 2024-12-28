import { DomainError } from '../../shared/domain/DomainError.js'

export class ContactCannotRemoveWithChatsDomainError extends DomainError {
	constructor(id: string) {
		super(`Contact with id <<<${id}>>> has chats and cannot be removed`)
	}
}
