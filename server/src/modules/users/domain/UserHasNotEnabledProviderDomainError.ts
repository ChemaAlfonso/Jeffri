import { DomainError } from '../../shared/domain/DomainError.js'

export class UserHasNotEnabledProviderDomainError extends DomainError {
	constructor(id: string, provider: string) {
		super(`User with id <<<${id}>>> has not enabled the provider <<<${provider}>>>`)
	}
}
