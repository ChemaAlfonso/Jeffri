import { AiContext } from '../domain/AiContext.js'
import { AiContextFinder } from '../domain/AiContextFinder.js'
import { AiContextRepository } from '../domain/AiContextRepository.js'

export class UpdateAiContext {
	constructor(private readonly repository: AiContextRepository) {}

	async run(params: {
		id: string
		ownerId?: string
		name?: string
		content?: string
		enabledInBots?: string[]
		exclusive?: boolean
		enabled?: boolean
	}): Promise<void> {
		const { id, ownerId, name, content, enabledInBots, exclusive, enabled } = params

		const finder = new AiContextFinder(this.repository)
		const aiContext = await finder.run(id)

		const updatedData = {
			ownerId: ownerId || aiContext.ownerId,
			name: name || aiContext.name,
			content: content || aiContext.content,
			enabledInBots: enabledInBots || aiContext.enabledInBots,
			exclusive: exclusive ?? aiContext.exclusive,
			enabled: enabled ?? aiContext.enabled,
			createdAt: aiContext.createdAt
		}

		const user = new AiContext(
			id,
			updatedData.ownerId,
			updatedData.name,
			updatedData.content,
			updatedData.enabledInBots,
			updatedData.exclusive,
			updatedData.enabled,
			updatedData.createdAt
		)
		await this.repository.save(user)
	}
}
