import { ModelConfigPrimitives } from '../domain/ModelConfig.js'
import { ModelConfigRepository } from '../domain/ModelConfigRepository.js'

export class SearchModelConfigByOwner {
	constructor(private readonly repository: ModelConfigRepository) {}

	async run(ownerId: string): Promise<ModelConfigPrimitives | null> {
		const contact = await this.repository.searchByOwner(ownerId)
		return contact?.toPrimitives() ?? null
	}
}
