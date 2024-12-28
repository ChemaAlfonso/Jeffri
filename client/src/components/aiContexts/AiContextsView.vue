<template>
	<div>
		<AiContextsList :ai-contexts="aiContexts" />
	</div>
</template>

<script setup lang="ts">
import AiContextsList from '@/components/aiContexts/AiContextsList.vue'
import { useAiContexts } from '@/components/aiContexts/useAiContexts'

const { aiContexts, getAll } = useAiContexts()

getAll()
</script>
