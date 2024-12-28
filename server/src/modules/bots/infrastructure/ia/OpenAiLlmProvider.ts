import { Logger } from '../../../shared/domain/Logger.js'
import { LlmProvider, Questionable, LLM_MODEL } from '../../domain/LlmProvider.js'
import OpenAI from 'openai'

export class OpenAiLlmProvider implements LlmProvider {
	private readonly openAi: OpenAI
	private isAborted = false

	constructor(readonly apiKey: string, private readonly context: string[], private readonly logger: Logger) {
		this.openAi = new OpenAI({
			apiKey
		})
	}

	async chat(questionable: Questionable): Promise<string> {
		const { model, messageHistory, customContext, signal } = questionable

		this.logger.log(`[AI model] Using OpenAI with model ${model}`, 'debug')

		if (!signal || signal.aborted) throw new Error('AbortError')

		if (!Object.values(LLM_MODEL).includes(model)) throw new Error(`Model ${model} not found`)

		if (!customContext?.length) throw new Error('[AI model] No Custom contexts provided')

		const systemMessages = this.context.map(content => ({ role: 'system', content }))
		const customContextSystemMessages = customContext?.map(content => ({ role: 'system', content })) || []
		const historyWithSystem = [
			...systemMessages,
			...customContextSystemMessages,
			...messageHistory
		] as OpenAI.Chat.Completions.ChatCompletionMessageParam[]

		const payload: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
			model,
			messages: historyWithSystem,
			stream: true,
			max_completion_tokens: 1000,
			temperature: 1,
			top_p: 1
		}

		signal.onabort = () => {
			this.isAborted = true
		}

		let aiResponse = ''
		this.logger.log('[AI model] Requesting response...', 'info')
		const request = await this.openAi.chat.completions.create(payload)
		for await (const chunk of request) {
			if (this.isAborted) throw new Error('AbortError')
			aiResponse += chunk.choices[0]?.delta?.content || ''
		}

		if (this.isAborted) throw new Error('AbortError')

		return aiResponse || ''
	}
}
