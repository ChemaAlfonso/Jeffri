<template>
	<Button
		:label="getText('New bot')"
		size="small"
		icon="pi pi-plus"
		@click="setAddBotVisibility(true)"
		severity="success"
		class="mb-4"
	/>
	<div>
		<BotCard v-for="bot in bots" :key="bot.id" :bot="bot" />
	</div>

	<AddBotForm :show="showAddBotForm" @close="setAddBotVisibility(false)" />
	<BotLogin />
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import BotCard from '@/components/bots/BotCard.vue'
import { useBots } from '@/components/bots/useBots'
import AddBotForm from '@/components/bots/AddBotForm.vue'
import { ref } from 'vue'
import BotLogin from '@/components/bots/logins/BotLogin.vue'
import { getText } from '@/lang/getText'

const { getAll, bots } = useBots()

const showAddBotForm = ref(false)

const setAddBotVisibility = (value: boolean) => {
	showAddBotForm.value = value
}

getAll()
</script>
