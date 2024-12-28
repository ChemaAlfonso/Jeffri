import { Primitivable } from '../../shared/domain/Primitivable.js'

export interface AiContextPrimitives {
	id: string
	ownerId: string
	name: string
	content: string
	enabledInBots: string[]
	exclusive: boolean
	enabled: boolean
	createdAt: number
}

export class AiContext extends Primitivable<AiContextPrimitives> {
	constructor(
		public readonly id: string,
		public readonly ownerId: string,
		public readonly name: string,
		public readonly content: string,
		public readonly enabledInBots: string[],
		public readonly exclusive: boolean,
		public readonly enabled: boolean,
		public readonly createdAt: number
	) {
		super()
	}

	toPrimitives(): AiContextPrimitives {
		return {
			id: this.id,
			ownerId: this.ownerId,
			name: this.name,
			content: this.content,
			enabledInBots: this.enabledInBots,
			exclusive: this.exclusive,
			enabled: this.enabled,
			createdAt: this.createdAt
		}
	}

	static fromPrimitives(primitives: AiContextPrimitives): AiContext {
		return new AiContext(
			primitives.id,
			primitives.ownerId,
			primitives.name,
			primitives.content,
			primitives.enabledInBots,
			primitives.exclusive,
			primitives.enabled,
			primitives.createdAt
		)
	}
}
