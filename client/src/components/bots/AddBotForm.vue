<template>
	<Dialog v-model:visible="visible" @hide="close" modal :header="getText('Add bot')" :style="{ width: '25rem' }">
		<span class="text-surface-500 dark:text-surface-400 block mb-8">{{ getText('Select the bot type') }}</span>

		<div class="flex items-center gap-4 mb-8">
			<Select
				v-model="selectedBotType"
				:options="botTypes"
				optionLabel="name"
				option-value="value"
				:placeholder="getText('Select a type')"
				:empty-message="getText('No more bots available')"
				class="w-full"
			/>
		</div>
		<div class="flex justify-end gap-2">
			<Button type="button" :label="getText('Cancel')" severity="secondary" @click="close"></Button>
			<Button
				:disabled="!selectedBotType"
				type="button"
				:label="getText('Create')"
				@click="createNewBot"
			></Button>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { computed, ref, watch } from 'vue'
import { getText } from '@/lang/getText'
import { useBots } from '@/components/bots/useBots'

const { notCreatedBotNames, saveForName } = useBots()

interface AddBotFormProps {
	show: boolean
}

const props = defineProps<AddBotFormProps>()

const visible = ref(props.show)

const emit = defineEmits(['close'])

const close = () => {
	emit('close')
}

const selectedBotType = ref()
const botTypes = computed(() => notCreatedBotNames.value.map(name => ({ name: getText(name), value: name })))

const createNewBot = () => {
	saveForName(selectedBotType.value)
	selectedBotType.value = null
	close()
}

watch(
	() => props.show,
	value => {
		visible.value = value
	}
)
</script>

<style scoped></style>
