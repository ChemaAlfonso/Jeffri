import { AiContext } from './AiContext.js'
import { AiContextNotExistsDomainError } from './AiContextNotExistsDomainError.js'
import { AiContextRepository } from './AiContextRepository.js'

export class AiContextFinder {
	constructor(private readonly repository: AiContextRepository) {}

	async run(id: string): Promise<AiContext> {
		const aiContext = await this.repository.search(id)

		if (!aiContext) {
			throw new AiContextNotExistsDomainError(id)
		}

		return aiContext
	}
}
