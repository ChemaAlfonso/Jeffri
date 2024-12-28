import { asyncContainer } from '../../../../app/di/container.js'
import { Logger } from '../../../shared/domain/Logger.js'
import { LlmProvider, Questionable, LLM_MODEL } from '../../domain/LlmProvider.js'

export class LlmProviderManager implements LlmProvider {
	private openAiModels: LLM_MODEL[] = [LLM_MODEL.GPT4O_MINI]

	async chat(questionable: Questionable): Promise<string> {
		const { model } = questionable

		const llmProvider = await this.getLlmProvider(model)

		return llmProvider.chat(questionable)
	}

	private async getLlmProvider(model: LLM_MODEL) {
		const container = await asyncContainer()

		if (this.isOpenAiModel(model)) return container.get('Chats.OpenLlmProvider')

		return container.get('Chats.OllamaLlmProvider')
	}

	private isOpenAiModel(model: LLM_MODEL): boolean {
		return this.openAiModels.includes(model)
	}
}
