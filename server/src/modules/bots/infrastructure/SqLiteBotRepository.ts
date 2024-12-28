import { BOT_NAME, Bot, BotPrimitives } from '../domain/Bot.js'
import { BotRepository } from '../domain/BotRepository.js'
import { SQLiteDb } from '../../shared/infrastructure/SQLiteDb.js'

export interface BotSchema {
	id: string
	ownerId: string
	name: BOT_NAME
	enabled: string
	whitelist: string
	blacklist: string
	createdAt: number
}

export class SQLiteBotRepository implements BotRepository {
	private tableName = 'bots'

	constructor(private readonly db: SQLiteDb) {}

	async save(bot: Bot): Promise<void> {
		const primitives: BotSchema = {
			...bot.toPrimitives(),
			enabled: bot.enabled ? 'true' : '',
			whitelist: JSON.stringify(bot.whitelist || []),
			blacklist: JSON.stringify(bot.blacklist || [])
		}
		await this.db.upsert(this.tableName, primitives, bot.id)
	}

	async search(id: string): Promise<Bot | null> {
		const row = await this.db.get<BotSchema>(this.tableName, { id })

		if (!row) {
			return null
		}

		return Bot.fromPrimitives({
			...row,
			enabled: row.enabled === 'true',
			whitelist: JSON.parse(row.whitelist),
			blacklist: JSON.parse(row.blacklist)
		})
	}

	async searchAll(ownerId: string): Promise<Bot[]> {
		const rows = await this.db.getAll<BotSchema>(this.tableName, { ownerId })
		return rows.map(row =>
			Bot.fromPrimitives({
				...row,
				enabled: row.enabled === 'true',
				whitelist: JSON.parse(row.whitelist),
				blacklist: JSON.parse(row.blacklist)
			})
		)
	}

	async searchByName(ownerId: string, name: BOT_NAME): Promise<Bot | null> {
		const row = await this.db.get<BotSchema>(this.tableName, { ownerId, name })

		if (!row) {
			return null
		}

		return Bot.fromPrimitives({
			...row,
			enabled: row.enabled === 'true',
			whitelist: JSON.parse(row.whitelist),
			blacklist: JSON.parse(row.blacklist)
		})
	}

	async remove(id: string): Promise<void> {
		await this.db.remove(this.tableName, { id })
	}
}
