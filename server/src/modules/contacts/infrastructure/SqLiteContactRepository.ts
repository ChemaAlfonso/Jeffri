import { Contact, ContactPrimitives } from '../domain/Contact.js'
import { ContactRepository } from '../domain/ContactRepository.js'
import { SQLiteDb } from '../../shared/infrastructure/SQLiteDb.js'
import { BOT_NAME } from '../../bots/domain/Bot.js'

export interface ContactSchema {
	id: string
	ownerId: string
	name: string
	avatar: string
	botHandlers: string
	contexts: string
	createdAt: number
}

export class SQLiteContactRepository implements ContactRepository {
	private tableName = 'contacts'

	constructor(private readonly db: SQLiteDb) {}

	async save(contact: Contact): Promise<void> {
		const primitives: ContactSchema = {
			...contact.toPrimitives(),
			contexts: contact.contexts.filter(Boolean).join(','),
			botHandlers: JSON.stringify(contact.botHandlers)
		}
		await this.db.upsert(this.tableName, primitives, contact.id)
	}

	async search(id: string): Promise<Contact | null> {
		const row = await this.db.get<ContactSchema>(this.tableName, { id })

		if (!row) {
			return null
		}

		return Contact.fromPrimitives({
			...row,
			contexts: (row.contexts || '').split(',').filter(Boolean),
			botHandlers: JSON.parse(row.botHandlers)
		})
	}

	async searchByBotHandler(ownerId: string, botName: BOT_NAME, handler: string): Promise<Contact | null> {
		const row = await this.db.getAll<ContactSchema>(this.tableName, { ownerId })

		const found = row.find(row => {
			const providers = JSON.parse(row.botHandlers) as { [key in BOT_NAME]?: string }
			return providers[botName] === handler
		})

		if (!found) {
			return null
		}

		return Contact.fromPrimitives({
			...found,
			contexts: (found.contexts || '').split(',').filter(Boolean),
			botHandlers: JSON.parse(found.botHandlers)
		})
	}

	async searchAll(ownerId: string): Promise<Contact[]> {
		const rows = await this.db.getAll<ContactSchema>(this.tableName, { ownerId })
		return rows.map(row =>
			Contact.fromPrimitives({
				...row,
				contexts: (row.contexts || '').split(',').filter(Boolean),
				botHandlers: JSON.parse(row.botHandlers)
			})
		)
	}

	async remove(id: string): Promise<void> {
		await this.db.remove(this.tableName, { id })
	}
}
