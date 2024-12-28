export interface AiConfig {
	id: string
	model: string
	config: {
		enableTools?: boolean
		temperature?: number
		topK?: number
		topP?: number
	}
	createdAt: number
}
