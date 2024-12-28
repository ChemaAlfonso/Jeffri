import { ModelConfigFinder } from '../domain/ModelConfigFinder.js'
import { ModelConfigRepository } from '../domain/ModelConfigRepository.js'

export class RemoveModelConfig {
	constructor(private readonly repository: ModelConfigRepository) {}

	async run(id: string): Promise<void> {
		const finder = new ModelConfigFinder(this.repository)
		const user = await finder.run(id)

		await this.repository.remove(user.id)
	}
}
