import { AiContext } from './AiContext.js'

export interface AiContextRepository {
	save(AiContext: AiContext): Promise<void>
	search(id: string): Promise<AiContext | null>
	searchAll(ownerId: string): Promise<AiContext[]>
	searchByBotName(ownerId: string, botName: string): Promise<AiContext[]>
	remove(id: string): Promise<void>
}
