import type { AiConfig } from '@/modules/aiConfig/AiConfig'
import { aiConfigStore } from '@/components/aiConfig/AiConfigStore'
import { useApi } from '@/modules/connection/Api'
import { storeToRefs } from 'pinia'
import { v4 } from 'uuid'

export const useAiConfig = () => {
	const { aiConfig, models, isLocalAi } = storeToRefs(aiConfigStore())
	const { setAiConfig, cleanAiConfig } = aiConfigStore()
	const { getAiConfig, saveAiConfig, removeAiConfig } = useApi()

	const getMine = async () => {
		cleanAiConfig()

		const fetchedConfig = await getAiConfig()
		setAiConfig(fetchedConfig)

		return aiConfig.value
	}

	const saveConfig = async (params: {
		id?: string
		model: string
		config: {
			enableTools?: boolean
			temperature?: number
			topK?: number
			topP?: number
		}
		createdAt?: number
	}) => {
		const aiContext: AiConfig = {
			...params,
			id: params.id || v4(),
			createdAt: params.createdAt || new Date().getTime()
		}

		await saveAiConfig(aiContext)
	}

	return {
		aiConfig,
		models,
		isLocalAi,
		getMine,
		saveConfig
	}
}
