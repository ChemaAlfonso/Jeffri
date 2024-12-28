import { ModelConfigPrimitives } from '../domain/ModelConfig.js'
import { ModelConfigRepository } from '../domain/ModelConfigRepository.js'

export class SearchModelConfig {
	constructor(private readonly repository: ModelConfigRepository) {}

	async run(id: string): Promise<ModelConfigPrimitives | null> {
		const modelConfig = await this.repository.search(id)
		return modelConfig?.toPrimitives() ?? null
	}
}
