import { Primitivable } from '../../shared/domain/Primitivable.js'

export interface ModelConfigConfig {
	enableTools?: boolean
	temperature?: number
	topK?: number
	topP?: number
}

export interface ModelConfigPrimitives {
	id: string
	ownerId: string
	model: string
	config: ModelConfigConfig
	createdAt: number
}

export class ModelConfig extends Primitivable<ModelConfigPrimitives> {
	constructor(
		public readonly id: string,
		public readonly ownerId: string,
		public readonly model: string,
		public readonly config: ModelConfigConfig,
		public readonly createdAt: number
	) {
		super()
	}

	toPrimitives(): ModelConfigPrimitives {
		return {
			id: this.id,
			ownerId: this.ownerId,
			model: this.model,
			config: this.config,
			createdAt: this.createdAt
		}
	}

	static fromPrimitives(primitives: ModelConfigPrimitives): ModelConfig {
		return new ModelConfig(
			primitives.id,
			primitives.ownerId,
			primitives.model,
			primitives.config,
			primitives.createdAt
		)
	}
}
