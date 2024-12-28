import { ModelConfig } from '../domain/ModelConfig.js'
import { ModelConfigFinder } from '../domain/ModelConfigFinder.js'
import { ModelConfigRepository } from '../domain/ModelConfigRepository.js'

export class UpdateModelConfig {
	constructor(private readonly repository: ModelConfigRepository) {}

	async run(id: string, ownerId?: string, model?: string, config?: Record<string, string | number>): Promise<void> {
		const finder = new ModelConfigFinder(this.repository)
		const modelConfig = await finder.run(id)

		const updatedData = {
			ownerId: ownerId || modelConfig.ownerId,
			model: model || modelConfig.model,
			config: config || modelConfig.config,
			createdAt: modelConfig.createdAt
		}

		const user = new ModelConfig(
			id,
			updatedData.ownerId,
			updatedData.model,
			updatedData.config,
			updatedData.createdAt
		)
		await this.repository.save(user)
	}
}
