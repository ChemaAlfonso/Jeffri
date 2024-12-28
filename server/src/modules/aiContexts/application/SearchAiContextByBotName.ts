import { AiContextPrimitives } from '../domain/AiContext.js'
import { AiContextRepository } from '../domain/AiContextRepository.js'

export class SearchAiContextByBotName {
	constructor(private readonly repository: AiContextRepository) {}

	async run(ownerId: string, botName: string): Promise<AiContextPrimitives[]> {
		const aiContexts = await this.repository.searchByBotName(ownerId, botName)
		return aiContexts.map(aicontext => aicontext.toPrimitives())
	}
}
