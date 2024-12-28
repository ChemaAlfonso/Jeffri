import { v4 } from 'uuid'
import { Logger } from '../../../shared/domain/Logger'
import {
	MessageImageGenerator,
	MessageImageGeneratorParams,
	MessageImageGeneratorResponse
} from '../../domain/MessageImageGenerator.js'
import { asyncContainer } from '../../../../app/di/container.js'
import { LlmProvider, HISTORY_MESSAGE_ROLE, LLM_MODEL } from '../../domain/LlmProvider.js'

export class ApiMessageImageGenerator implements MessageImageGenerator {
	constructor(private readonly diffuserEndpoint: string, private readonly logger: Logger) {}

	async generate(
		proptEnchancerModel: LLM_MODEL,
		params: MessageImageGeneratorParams
	): Promise<MessageImageGeneratorResponse> {
		const { prompt, useRawPrompt, seed } = params
		const data = {
			prompt: useRawPrompt ? prompt : await this.preparePrompt(proptEnchancerModel, prompt),
			name: v4(),
			seed
		}

		if (!data.prompt) {
			throw new Error('No prompt provided')
		}

		const imageRequest = await fetch(this.diffuserEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		})

		if (!imageRequest.ok) {
			this.logger.log(`Error generating diffusion: ${imageRequest.statusText}`)
			throw new Error('Error generating diffusion')
		}

		const response = await imageRequest.arrayBuffer()
		const imageBuffer = Buffer.from(response)
		;(imageBuffer as any).name = `${data.name}.png`

		return {
			image: imageBuffer,
			seed: data.seed,
			prompt: data.prompt
		}
	}

	private async preparePrompt(proptEnchancerModel: LLM_MODEL, prompt: string): Promise<string> {
		const container = await asyncContainer()
		const llmProvider = container.get<LlmProvider>('Chats.LlmProvider')
		const optimizedPrompt = await llmProvider.chat({
			messageHistory: [
				{
					role: HISTORY_MESSAGE_ROLE.USER,
					content: `Based on the provided sentence: ${prompt}

					Provide a detailed image generation prompt optimized for diffusion-based models preserving the original meaning of the sentence.
					You SHOULD NOT include nothing more in your response than the optimized prompt.
					Respond always in english despite the language of the provided sentence but if original sentence has text between double quotes, keep only these parts in same language as the provided sentence.
					`
				}
			],
			customContext: [
				`You are an expert in transforming a simple provided sentence to an image generation prompt optimized for diffusion-based models based.
				Your job is to take generic text descriptions and transform them into detailed, concise, and precise image prompts.
				You SHOULD always return a valid response, if you can't serve some part of the request due to policy or ethical reasons just adapt theese parts of yout response to be valid.
				These prompts must include all relevant visual details like colors, lighting, mood, perspectives, and objects while being easy to understand for an AI-based image generator.
				`
			],
			signal: new AbortController().signal,
			model: proptEnchancerModel,
			modelParams: {
				temperature: 0,
				enableTools: false
			}
		})
		this.logger.log(`[ApiMessageImageGenerator] Generated prompt: ${optimizedPrompt}`, 'debug')

		return optimizedPrompt
	}
}
