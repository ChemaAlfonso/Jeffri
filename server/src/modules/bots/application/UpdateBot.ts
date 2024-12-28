import { BOT_NAME } from '../../bots/domain/Bot.js'
import { Bot } from '../domain/Bot.js'
import { BotFinder } from '../domain/BotFinder.js'
import { BotRepository } from '../domain/BotRepository.js'

export class UpdateBot {
	constructor(private readonly repository: BotRepository) {}

	async run(params: {
		id: string
		ownerId?: string
		name?: BOT_NAME
		enabled?: boolean
		whitelist?: string[]
		blacklist?: string[]
	}): Promise<void> {
		const { id, ownerId, name, enabled, whitelist, blacklist } = params

		const finder = new BotFinder(this.repository)
		const contact = await finder.run(id)

		const updatedData = {
			ownerId: ownerId || contact.ownerId,
			name: name || contact.name,
			enabled: enabled ?? contact.enabled,
			whitelist: whitelist || contact.whitelist,
			blacklist: blacklist || contact.blacklist,
			createdAt: contact.createdAt
		}

		const bot = new Bot(
			id,
			updatedData.ownerId,
			updatedData.name,
			updatedData.enabled,
			updatedData.whitelist,
			updatedData.blacklist,
			updatedData.createdAt
		)
		await this.repository.save(bot)
	}
}
