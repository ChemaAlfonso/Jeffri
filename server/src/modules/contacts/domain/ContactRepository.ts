import { BOT_NAME } from '../../bots/domain/Bot.js'
import { Contact } from './Contact.js'

export interface ContactRepository {
	save(Contact: Contact): Promise<void>
	search(id: string): Promise<Contact | null>
	searchAll(ownerId: string): Promise<Contact[]>
	searchByBotHandler(ownerId: string, botName: BOT_NAME, id: string): Promise<Contact | null>
	remove(id: string): Promise<void>
}
