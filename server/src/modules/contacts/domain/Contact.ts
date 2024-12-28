import { BOT_NAME } from '../../bots/domain/Bot.js'
import { Primitivable } from '../../shared/domain/Primitivable.js'

export interface ContactPrimitives {
	id: string
	ownerId: string
	name: string
	avatar: string
	botHandlers: { [key in BOT_NAME]?: string }
	contexts: string[]
	createdAt: number
}

export class Contact extends Primitivable<ContactPrimitives> {
	constructor(
		public readonly id: string,
		public readonly ownerId: string,
		public readonly name: string,
		public readonly avatar: string,
		public readonly botHandlers: { [key in BOT_NAME]?: string },
		public readonly contexts: string[],
		public readonly createdAt: number
	) {
		super()
	}

	getIdOnProvider(botName: BOT_NAME): string | null {
		return this.botHandlers[botName] || null
	}

	setIdForProvider(botName: BOT_NAME, id: string): void {
		this.botHandlers[botName] = id
	}

	hasProvider(botName: BOT_NAME): boolean {
		return this.botHandlers[botName] !== undefined
	}

	toPrimitives(): ContactPrimitives {
		return {
			id: this.id,
			ownerId: this.ownerId,
			name: this.name,
			avatar: this.avatar,
			botHandlers: this.botHandlers,
			contexts: this.contexts,
			createdAt: this.createdAt
		}
	}

	static fromPrimitives(primitives: ContactPrimitives): Contact {
		return new Contact(
			primitives.id,
			primitives.ownerId,
			primitives.name,
			primitives.avatar,
			primitives.botHandlers,
			primitives.contexts,
			primitives.createdAt
		)
	}
}
