export class CannotLogoutWithoutConnectionDomainError extends Error {
	constructor() {
		super('Cannot logout without connection, please connect first')
	}
}
