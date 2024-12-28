import { ModelConfig } from '../domain/ModelConfig.js'
import { ModelConfigRepository } from '../domain/ModelConfigRepository.js'
import { SQLiteDb } from '../../shared/infrastructure/SQLiteDb.js'

export interface ModelConfigSchema {
	id: string
	ownerId: string
	model: string
	config: string
	createdAt: number
}

export class SQLiteModelConfigRepository implements ModelConfigRepository {
	private tableName = 'aiConfig'

	constructor(private readonly db: SQLiteDb) {}

	async save(model: ModelConfig): Promise<void> {
		const modelConfig = {
			...model.toPrimitives(),
			config: JSON.stringify(model.config || '{}')
		}

		await this.db.upsert(this.tableName, modelConfig, model.id)
	}

	async search(id: string): Promise<ModelConfig | null> {
		const row = await this.db.get<ModelConfigSchema>(this.tableName, { id })

		if (!row) {
			return null
		}

		return ModelConfig.fromPrimitives({
			...row,
			config: JSON.parse(row.config || '{}')
		})
	}

	async searchByOwner(ownerId: string): Promise<ModelConfig | null> {
		const row = await this.db.get<ModelConfigSchema>(this.tableName, { ownerId })

		if (!row) {
			return null
		}

		return ModelConfig.fromPrimitives({
			...row,
			config: JSON.parse(row.config || '{}')
		})
	}

	async searchAll(ownerId: string): Promise<ModelConfig[]> {
		const rows = await this.db.getAll<ModelConfigSchema>(this.tableName, { ownerId })
		return rows.map(row =>
			ModelConfig.fromPrimitives({
				...row,
				config: JSON.parse(row.config || '{}')
			})
		)
	}

	async remove(id: string): Promise<void> {
		await this.db.remove(this.tableName, { id })
	}
}
