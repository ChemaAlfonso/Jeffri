import type { AiContext } from '@/modules/aiContexts/AiContext'
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

export const aiContextsStore = defineStore('AiContextsStore', () => {
	const aiContexts: Ref<AiContext[]> = ref([])

	const saveAiContext = (newAiContext: AiContext) => {
		const existingAiContexts = aiContexts.value.find(aiContext => aiContext.id === newAiContext.id)
		if (existingAiContexts) {
			Object.assign(existingAiContexts, newAiContext)
			return
		}

		aiContexts.value.push(newAiContext)
	}

	const removeAiContext = (id: string) => {
		const index = aiContexts.value.findIndex(aiContext => aiContext.id === id)
		if (index === -1) return

		aiContexts.value.splice(index, 1)
	}

	const clearAiContexts = () => {
		aiContexts.value = []
	}

	const sortAiContexts = () => {
		aiContexts.value.sort((a: AiContext, b: AiContext) => {
			return `${a.name}`.localeCompare(`${b.name}`)
		})
	}

	return {
		aiContexts,
		saveAiContext,
		removeAiContext,
		clearAiContexts,
		sortAiContexts
	}
})
