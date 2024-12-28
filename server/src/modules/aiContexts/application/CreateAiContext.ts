import { AiContext } from '../domain/AiContext.js'
import { AiContextRepository } from '../domain/AiContextRepository.js'

export class CreateAiContext {
	constructor(private readonly repository: AiContextRepository) {}

	async run(params: {
		id: string
		ownerId: string
		name: string
		content: string
		enabledInBots: string[]
		exclusive: boolean
		enabled: boolean
		createdAt: number
	}): Promise<void> {
		const { id, ownerId, name, content, enabledInBots, exclusive, enabled, createdAt } = params
		const user = new AiContext(id, ownerId, name, content, enabledInBots, exclusive, enabled, createdAt)
		await this.repository.save(user)
	}
}
