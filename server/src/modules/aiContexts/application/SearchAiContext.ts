import { AiContextPrimitives } from '../domain/AiContext.js'
import { AiContextRepository } from '../domain/AiContextRepository.js'

export class SearchAiContext {
	constructor(private readonly repository: AiContextRepository) {}

	async run(id: string): Promise<AiContextPrimitives | null> {
		const aiContext = await this.repository.search(id)
		return aiContext?.toPrimitives() ?? null
	}
}
