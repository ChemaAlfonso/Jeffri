import { ModelConfig } from './ModelConfig.js'

export interface ModelConfigRepository {
	save(ModelConfig: ModelConfig): Promise<void>
	search(id: string): Promise<ModelConfig | null>
	searchByOwner(ownerId: string): Promise<ModelConfig | null>
	remove(id: string): Promise<void>
}
