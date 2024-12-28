import { ModelConfig } from './ModelConfig.js'
import { ModelConfigNotExistsDomainError } from './ModelConfigNotExistsDomainError.js'
import { ModelConfigRepository } from './ModelConfigRepository.js'

export class ModelConfigFinder {
	constructor(private readonly repository: ModelConfigRepository) {}

	async run(id: string): Promise<ModelConfig> {
		const modelConfig = await this.repository.search(id)

		if (!modelConfig) {
			throw new ModelConfigNotExistsDomainError(id)
		}

		return modelConfig
	}
}
