import { Logger } from '../../../shared/domain/Logger.js'
import { LlmProvider, Questionable, LLM_MODEL } from '../../domain/LlmProvider.js'
import { ChatRequest, Ollama, PullRequest } from 'ollama'
import { availableTools, getMessagesFromToolCalls } from './tools/tools.js'
import { getEnv } from '../../../../getEnv.js'

const aiEndpoint = getEnv('OLLAMA_URL')

export class OllamaLlmProvider implements LlmProvider {
	private readonly ollama: Ollama
	private isAborted = false

	constructor(private readonly context: string[], private readonly logger: Logger) {
		this.ollama = new Ollama({ host: aiEndpoint })
	}

	async chat(questionable: Questionable): Promise<string> {
		this.logger.log(`[AI model] Using endpoint ${aiEndpoint}`, 'debug')

		const { model, modelParams, messageHistory, customContext, signal } = questionable

		if (!signal || signal.aborted) throw new Error('AbortError')

		if (!Object.values(LLM_MODEL).includes(model)) throw new Error(`Model ${model} not found`)

		await this.downloadModelIfNotExists(model)

		if (!customContext?.length) throw new Error('[AI model] No Custom contexts provided')

		const systemMessages = this.context.map(content => ({ role: 'system', content }))
		const customContextSystemMessages = customContext?.map(content => ({ role: 'system', content })) || []
		const historyWithSystem = [...systemMessages, ...customContextSystemMessages, ...messageHistory]

		const payload: ChatRequest & { stream?: false } = {
			model,
			messages: historyWithSystem,
			stream: false,
			options: {
				num_predict: 1000,
				temperature: modelParams?.temperature ? +modelParams?.temperature : 0.7,
				top_k: modelParams?.topK ? +modelParams?.topK : 40,
				top_p: modelParams?.topP ? +modelParams?.topP : 0.9,
				num_ctx: 8192
			}
		}

		if (modelParams?.enableTools) payload.tools = availableTools.map(tool => tool.description)

		signal.onabort = () => {
			this.ollama.abort()
			this.isAborted = true
		}

		let aiResponse = ''
		this.logger.log('[AI model] Requesting response...', 'info')
		const request = await this.ollama.chat(payload)

		if (this.isAborted) throw new Error('AbortError')

		aiResponse = request.message.content

		this.logger.log('[AI model] Response received', 'debug')

		if (request.message.tool_calls) {
			const toolCallNames = request.message.tool_calls.map(toolCall => toolCall.function.name)
			this.logger.log(`[AI model] Tool calls detected: <<<${toolCallNames.join(', ')}>>>`, 'debug')

			const toolMessages = await getMessagesFromToolCalls(request.message.tool_calls)
			toolMessages.forEach(toolMessage => {
				payload.messages!.push(toolMessage)
				this.logger.log(`[AI model] Tool message added: <<<${toolMessage.content}>>>`, 'debug')
			})

			this.logger.log('[AI model] Requesting new response with tool responses included...', 'debug')

			const requestWithTools = await this.ollama.chat(payload)
			aiResponse = requestWithTools.message.content

			this.logger.log('[AI model] Response with tools included received', 'debug')
		}

		if (this.isAborted) throw new Error('AbortError')

		return aiResponse || ''
	}

	private async downloadModelIfNotExists(model: LLM_MODEL) {
		const listModelsResponse = await this.ollama.list()
		const availableModels = listModelsResponse.models || []

		const foundModel = availableModels.find(m => m.name.includes(`${model}`))

		if (foundModel) return

		this.logger.log(`[AI model] Model not found, downloading <<<${model}>>>...`, 'warn')

		const downloadPayload: PullRequest & { stream?: false } = {
			model,
			stream: false
		}

		const pullRequest = await this.ollama.pull(downloadPayload)
		const downloaded = pullRequest.status === 'success'

		this.logger.log(`[AI model] Downloaded <<<${model}>>>: ${downloaded}`, 'info')

		if (!downloaded) throw new Error('Error downloading model')
	}
}
