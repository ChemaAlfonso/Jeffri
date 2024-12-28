import type { AiContext } from '@/modules/aiContexts/AiContext'
import { aiContextsStore } from '@/components/aiContexts/AiContextsStore'
import { useApi } from '@/modules/connection/Api'
import type { BOT_NAME } from '@/modules/bots/Bot'
import { storeToRefs } from 'pinia'
import { v4 } from 'uuid'
import { computed } from 'vue'

export const useAiContexts = () => {
	const { aiContexts } = storeToRefs(aiContextsStore())
	const { saveAiContext, removeAiContext, clearAiContexts, sortAiContexts } = aiContextsStore()
	const {
		getAiContexts,
		saveAiContext: saveAiContextsOnServer,
		removeAiContexts: removeAiContextsFromServer
	} = useApi()

	const exclusiveContexts = computed(() => {
		if (!aiContexts.value) return []
		return aiContexts.value.filter(context => context.exclusive)
	})

	const getAll = async () => {
		clearAiContexts()

		const fetchedContexts = await getAiContexts()

		fetchedContexts.forEach(context => {
			saveAiContext(context)
		})

		sortAiContexts()

		return aiContexts.value
	}

	const save = async (params: {
		id?: string
		name: string
		content: string
		enabledInBots: BOT_NAME[]
		exclusive: boolean
		enabled: boolean
		createdAt?: number
	}) => {
		const aiContext: AiContext = {
			...params,
			id: params.id || v4(),
			createdAt: params.createdAt || new Date().getTime()
		}

		await saveAiContextsOnServer(aiContext)
		saveAiContext(aiContext)

		if (!params.id) sortAiContexts()
	}

	const remove = async (id: string) => {
		await removeAiContextsFromServer(id)
		removeAiContext(id)
	}

	return {
		aiContexts,
		exclusiveContexts,
		getAll,
		save,
		remove
	}
}
