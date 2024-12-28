import { ModelConfigConfig } from '../../modelConfigs/domain/ModelConfig'

export enum LLM_MODEL {
	// Llama
	LLAMA3_1 = 'llama3.1',
	LLAMA3_1_8B_TEXT_Q5_K_M = 'llama3.1:8b-instruct-q5_K_M',
	LLAMA3_1_8B_TEXT_Q6_K = 'llama3.1:8b-instruct-q6_K',
	LLAMA3_1_8B_INSTRUCT_Q8 = 'llama3.1:8b-instruct-q8_0',
	LLAMA3_1_8B_INSTRUCT_Q8_ABLITERATED = 'llama3.1-8b-instruct-abliterated',

	LLAMA3_2_1B = 'llama3.2:1b',
	LLAMA3_2_3B = 'llama3.2:3b',
	LLAMA3_2_8B_TEXT_Q5_K_M = 'llama3.2:3b-text-q8_0',

	LLAMA3_3 = 'llama3.3',

	// Gemma
	GEMMA2 = 'gemma2',
	GEMMA2_27B = 'gemma2:27b',
	GEMMA2_27B_INSTRUCT_Q4_K_M = 'gemma2:27b-instruct-q4_K_M',
	GEMMA2_9B_INTRUCT_Q5_0 = 'gemma2:9b-instruct-q5_0',
	GEMMA2_27B_INSTRUCT_Q6_K = 'gemma2:27b-instruct-q6_K',

	// Others
	COMMAND_R_35B_08_2024_Q4_K_M = 'command-r:35b-08-2024-q4_K_M',
	PHI3_14b = 'phi3:14b',
	MISTRAL_NEMO = 'mistral-nemo',
	LLAVA_13B = 'llava:13b',
	QWQ = 'qwq',

	// OpenAI
	GPT4O_MINI = 'gpt-4o-mini',
	GPT4O = 'gpt-4o',
	GPT_O1 = 'o1',
	GPT_O1_MINI = 'o1-mini'
}

export enum HISTORY_MESSAGE_ROLE {
	USER = 'user',
	ASSISTANT = 'assistant',
	TOOL = 'tool'
}

export interface HistoryMessage {
	role: HISTORY_MESSAGE_ROLE
	content: string
}

export interface Questionable {
	readonly messageHistory: HistoryMessage[]
	readonly customContext: string[]
	readonly model: LLM_MODEL
	readonly modelParams?: ModelConfigConfig
	readonly signal: AbortSignal
}

export interface LlmProvider {
	chat(questionable: Questionable): Promise<string>
}
