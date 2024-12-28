import { Logger } from '../../modules/shared/domain/Logger.js'
import { SQLiteDb } from '../../modules/shared/infrastructure/SQLiteDb.js'
import { asyncContainer } from '../di/container.js'

const tables = [
	{
		name: 'contacts',
		schema: {
			id: 'TEXT',
			ownerId: 'TEXT',
			name: 'TEXT',
			avatar: 'TEXT',
			botHandlers: 'TEXT',
			contexts: 'TEXT',
			createdAt: 'INTEGER'
		}
	},
	{
		name: 'users',
		schema: {
			id: 'TEXT',
			name: 'TEXT',
			email: 'TEXT',
			phone: 'TEXT',
			password: 'TEXT',
			sessions: 'TEXT',
			createdAt: 'INTEGER'
		}
	},
	{
		name: 'aiContexts',
		schema: {
			id: 'TEXT',
			ownerId: 'TEXT',
			name: 'TEXT',
			content: 'TEXT',
			enabledInBots: 'TEXT',
			exclusive: 'TEXT',
			enabled: 'TEXT',
			createdAt: 'INTEGER'
		}
	},
	{
		name: 'aiConfig',
		schema: {
			id: 'TEXT',
			ownerId: 'TEXT',
			model: 'TEXT',
			config: 'TEXT',
			createdAt: 'INTEGER'
		}
	},
	{
		name: 'bots',
		schema: {
			id: 'TEXT',
			ownerId: 'TEXT',
			name: 'TEXT',
			enabled: 'TEXT',
			whitelist: 'TEXT',
			blacklist: 'TEXT',
			createdAt: 'INTEGER'
		}
	}
]

export const dbSeeder = () => {
	const seed = async () => {
		const container = await asyncContainer()
		const logger = container.get<Logger>('Shared.Logger')
		const db = container.get<SQLiteDb>('Shared.DB')
		for (const table of tables) {
			const schema = Object.entries(table.schema)
				.map(([key, type]) => `${key} ${type}`)
				.join(', ')

			try {
				await db.query(`CREATE TABLE IF NOT EXISTS ${table.name} (${schema})`)
			} catch (error) {
				logger.log(error, 'error')
			}
		}
	}

	return {
		seed
	}
}
