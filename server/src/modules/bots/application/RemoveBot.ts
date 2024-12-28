import { BotFinder } from '../domain/BotFinder.js'
import { BotRepository } from '../domain/BotRepository.js'

export class RemoveBot {
	constructor(private readonly repository: BotRepository) {}

	async run(id: string): Promise<void> {
		const finder = new BotFinder(this.repository)
		const user = await finder.run(id)

		await this.repository.remove(user.id)
	}
}
