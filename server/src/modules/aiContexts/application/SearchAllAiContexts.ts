import { AiContextPrimitives } from '../domain/AiContext.js'
import { AiContextRepository } from '../domain/AiContextRepository.js'

export class SearchAllAiContexts {
	constructor(private readonly repository: AiContextRepository) {}

	async run(ownerId: string): Promise<AiContextPrimitives[]> {
		const aiContext = await this.repository.searchAll(ownerId)
		return aiContext.map(aiContext => aiContext.toPrimitives())
	}
}
