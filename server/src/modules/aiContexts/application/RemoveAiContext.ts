import { AiContextFinder } from '../domain/AiContextFinder.js'
import { AiContextRepository } from '../domain/AiContextRepository.js'

export class RemoveAiContext {
	constructor(private readonly repository: AiContextRepository) {}

	async run(id: string): Promise<void> {
		const finder = new AiContextFinder(this.repository)
		const user = await finder.run(id)

		await this.repository.remove(user.id)
	}
}
