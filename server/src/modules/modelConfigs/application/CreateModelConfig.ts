import { ModelConfig } from '../domain/ModelConfig.js'
import { ModelConfigForUserAlreadyExistsError } from '../domain/ModelConfigForUserAlreadyExistsError.js'
import { ModelConfigRepository } from '../domain/ModelConfigRepository.js'

export class CreateModelConfig {
	constructor(private readonly repository: ModelConfigRepository) {}

	async run(
		id: string,
		ownerId: string,
		model: string,
		config: Record<string, string | number>,
		createdAt: number
	): Promise<void> {
		const ownerAlreadyHasConfig = await this.repository.searchByOwner(ownerId)

		if (ownerAlreadyHasConfig) throw new ModelConfigForUserAlreadyExistsError(id, ownerId)

		const user = new ModelConfig(id, ownerId, model, config, createdAt)
		await this.repository.save(user)
	}
}
