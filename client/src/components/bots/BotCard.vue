<template>
	<Card class="mb-4">
		<template #title>
			<div class="flex items-center justify-between gap-2">
				<div class="flex items-center justify-start gap-2">
					<div class="flex items-center justify-center w-6 h-6">
						<img class="object-contain" :src="bot.icon" />
					</div>
					<span class="capitalize">
						{{ bot.name }}
					</span>
				</div>

				<div>
					<SplitButton
						:disabled="isLoading"
						:severity="bot.status === BOT_STATUS.CONNECTED ? 'danger' : 'success'"
						size="small"
						:label="activeOption.label"
						@click="activeOption.command"
						:model="items"
						:icon="activeOption.icon"
					/>
				</div>
			</div>
		</template>
		<template #content>
			<div class="text-sm">
				<p v-if="bot.status === BOT_STATUS.CONNECTED">
					{{ getText('The bot is') }}
					<span class="lowercase text-green-500">&nbsp;{{ statusText }}&nbsp;</span>
					{{ getText('and will answer messages') }}
				</p>
				<div v-else>
					{{ getText('The bot is') }}
					<span class="lowercase text-red-500">&nbsp;{{ statusText }}&nbsp;</span>
					{{ getText('and will not anwer messages') }}
				</div>
			</div>
		</template>
	</Card>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import SplitButton from 'primevue/splitbutton'
import { BOT_STATUS, type Bot } from '@/modules/bots/Bot'
import { computed, ref } from 'vue'
import { getText } from '@/lang/getText'
import type { MenuItem } from 'primevue/menuitem'
import { useBots } from '@/components/bots/useBots'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'

const toast = useToast()
const router = useRouter()

const { remove, turnOn, turnOff, checkStatus, logout } = useBots()

interface BotCardProps {
	bot: Bot
}

const props = defineProps<BotCardProps>()

const isLoading = ref(false)

// ===================================
// Status
// ===================================
const statusText = computed(() => {
	return props.bot.status === BOT_STATUS.CONNECTED ? getText('Ready') : getText('Stopped')
})

// ===================================
// Actions
// ===================================
const connect = async (bot: Bot) => {
	isLoading.value = true
	try {
		await turnOn(bot)
		toast.add({
			severity: 'success',
			summary: getText('Connected'),
			detail: getText('Bot connection started successfuly, please wait until bot is ready'),
			life: 5000
		})
	} catch (error) {
		console.error(error)
		toast.add({
			severity: 'error',
			summary: getText('Error'),
			detail: getText('Cannot connect, please try again...'),
			life: 5000
		})
	}
	isLoading.value = false
}

const disconnect = async (bot: Bot) => {
	isLoading.value = true
	try {
		await turnOff(bot)
		toast.add({
			severity: 'success',
			summary: getText('Disconnected'),
			detail: getText('Bot disconection started successfuly, please wait until bot is stopped'),
			life: 5000
		})
	} catch (error) {
		console.error(error)
		toast.add({
			severity: 'error',
			summary: getText('Error'),
			detail: getText('Cannot disconnect, please try again...'),
			life: 5000
		})
	}
	isLoading.value = false
}

// ===================================
// Menu options
// ===================================
const activeOption = computed(() => {
	return props.bot.status === BOT_STATUS.DISCONNECTED
		? {
				label: getText('Turn on'),
				command: () => {
					if (isLoading.value) return
					connect(props.bot)
				},
				icon: 'pi pi-play'
		  }
		: {
				label: getText('Turn off'),
				command: () => {
					if (isLoading.value) return
					disconnect(props.bot)
				},
				icon: 'pi pi-pause'
		  }
})

const items = computed(() => {
	const baseMenu: MenuItem[] = [
		{
			label: getText('Configure'),
			command: () => {
				router.push({ name: 'BotConfig', params: { name: props.bot.name } })
			},
			icon: 'pi pi-cog'
		},
		{
			separator: true
		},
		{
			label: getText('Remove'),
			command: async () => {
				await remove(props.bot)
			},
			icon: 'pi pi-trash'
		}
	]

	if (props.bot.status === BOT_STATUS.CONNECTED) {
		baseMenu.push({
			label: getText('Close session'),
			command: async () => {
				await logout(props.bot)
				await checkStatus(props.bot)
			},
			icon: 'pi pi-sign-out'
		})
	}

	return baseMenu
})
</script>
