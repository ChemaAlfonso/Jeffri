import { LLM_MODEL } from './LlmProvider'

export interface MessageImageGeneratorParams {
	seed: number
	prompt: string
	useRawPrompt: boolean
}

export interface MessageImageGeneratorResponse {
	image: Buffer
	seed: number
	prompt: string
}

export interface MessageImageGenerator {
	generate(
		proptEnchancerModel: LLM_MODEL,
		params: MessageImageGeneratorParams
	): Promise<MessageImageGeneratorResponse>
}
