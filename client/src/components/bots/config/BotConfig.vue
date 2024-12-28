<template>
	<Card class="mb-4">
		<template #content>
			<component :is="configComponent" />
		</template>
	</Card>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import BotConfigTelegram from '@/components/bots/config/BotConfigTelegram.vue'
import BotConfigWhatsapp from '@/components/bots/config/BotConfigWhatsapp.vue'
import type { BOT_NAME } from '@/modules/bots/Bot'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const config = {
	telegram: BotConfigTelegram,
	whatsapp: BotConfigWhatsapp
}

const name: BOT_NAME = String(route.params.name) as BOT_NAME

const configComponent = config[name] ?? null

if (!configComponent) {
	console.error(`BotConfig: ${name} is not a valid bot name`)
	router.push({ name: 'Bots' })
}
</script>
