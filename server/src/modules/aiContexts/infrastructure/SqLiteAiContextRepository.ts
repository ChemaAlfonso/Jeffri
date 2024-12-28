import { AiContext, AiContextPrimitives } from '../domain/AiContext.js'
import { AiContextRepository } from '../domain/AiContextRepository.js'
import { SQLiteDb } from '../../shared/infrastructure/SQLiteDb.js'

export interface AiContextSchema {
	id: string
	ownerId: string
	name: string
	content: string
	enabledInBots: string
	exclusive: number
	enabled: number
	createdAt: number
}

export class SQLiteAiContextRepository implements AiContextRepository {
	private tableName = 'aiContexts'

	constructor(private readonly db: SQLiteDb) {}

	async save(AiContext: AiContext): Promise<void> {
		const schemaData: AiContextSchema = {
			...AiContext.toPrimitives(),
			enabledInBots: AiContext.enabledInBots.join(','),
			exclusive: AiContext.exclusive ? 1 : 0,
			enabled: AiContext.enabled ? 1 : 0
		}
		await this.db.upsert(this.tableName, schemaData, AiContext.id)
	}

	async search(id: string): Promise<AiContext | null> {
		const row = await this.db.get<AiContextSchema>(this.tableName, { id })

		if (!row) {
			return null
		}

		return AiContext.fromPrimitives({
			...row,
			enabledInBots: (row.enabledInBots || '').split(',').filter(Boolean),
			exclusive: !row.exclusive || Number(row.exclusive) === 0 ? false : true,
			enabled: !row.enabled || Number(row.enabled) === 0 ? false : true
		})
	}

	async searchByBotName(ownerId: string, botName: string): Promise<AiContext[]> {
		const rows = (await this.db.getAll<AiContextSchema>(this.tableName, { ownerId }))?.filter(row =>
			row.enabledInBots.includes(botName)
		)

		return rows.map(row =>
			AiContext.fromPrimitives({
				...row,
				enabledInBots: (row.enabledInBots || '').split(',').filter(Boolean),
				exclusive: !row.exclusive || Number(row.exclusive) === 0 ? false : true,
				enabled: !row.enabled || Number(row.enabled) === 0 ? false : true
			})
		)
	}

	async searchAll(ownerId: string): Promise<AiContext[]> {
		const rows = await this.db.getAll<AiContextSchema>(this.tableName, { ownerId })
		return rows.map(row =>
			AiContext.fromPrimitives({
				...row,
				enabledInBots: (row.enabledInBots || '').split(',').filter(Boolean),
				exclusive: !row.exclusive || Number(row.exclusive) === 0 ? false : true,
				enabled: !row.enabled || Number(row.enabled) === 0 ? false : true
			})
		)
	}

	async remove(id: string): Promise<void> {
		await this.db.remove(this.tableName, { id })
	}
}
