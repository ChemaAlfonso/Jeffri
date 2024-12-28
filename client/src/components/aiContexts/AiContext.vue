<template>
	<Card>
		<template #content>
			<form @submit="submit" v-if="context">
				<div class="flex items-center justify-center gap-4">
					<div class="mb-8 flex items-center gap-4">
						<label class="block text-sm" for="exclusive">{{ getText('Exclusive') }}</label>
						<ToggleSwitch v-model="context.exclusive" />
					</div>

					<div class="mb-8 flex items-center gap-4">
						<label class="block text-sm" for="enabled">{{ getText('Enabled') }}</label>
						<ToggleSwitch v-model="context.enabled" />
					</div>
				</div>
				<div class="mb-8">
					<label class="block text-sm mb-2" for="name">{{ getText('Name') }}</label>
					<div class="text-gray-500 text-xs mb-1">
						{{
							getText(
								'This will not affect the context itself, but it will be used to identify it in the list.'
							)
						}}
					</div>
					<InputText
						class="w-full md:w-80"
						required
						v-model="context.name"
						:placeholder="getText('A memorable name')"
					/>
				</div>

				<div class="mb-8">
					<label class="block text-sm mb-2" for="enabledInBots">{{ getText('Used in') }}</label>
					<div class="text-gray-500 text-xs mb-1">
						{{ getText('This context will be used only by the selected bots.') }}
					</div>
					<div class="text-gray-500 text-xs mb-1">
						{{
							getText(
								'IMPORTANT: Despite you attach a context to a contact, the context will not be used with a bot if it is not enabled and included here for use with the bot.'
							)
						}}
					</div>
					<MultiSelect
						required
						v-model="context.enabledInBots"
						:options="botNames"
						option-label="name"
						option-value="value"
						placeholder="Select bots"
						:maxSelectedLabels="3"
						class="w-full md:w-80"
					/>
				</div>

				<div class="mb-8">
					<label class="flex items-center justify-between gap-2 text-sm mb-2" for="content">
						<span>{{ getText('Content') }}</span>
						<span
							class="text-xs"
							:class="{
								'text-red-500': context.content.length >= 1000
							}"
						>
							{{ context.content.length }}/1000
						</span>
					</label>
					<div class="text-gray-500 text-xs mb-1">
						{{
							getText(
								'Here you should include the bot behaviour or data that you want the bot to use in responses while using this context.'
							)
						}}
					</div>
					<div class="text-gray-500 text-xs mb-1">
						{{
							getText(
								'Try to keep it short, concise and related to one topic. If you need to add more you can create more contexts and enable them as little pieces to the bot.'
							)
						}}
					</div>
					<Textarea
						required
						v-model="context.content"
						autoResize
						rows="5"
						class="w-full"
						:maxlength="1000"
						:placeholder="getText('The context content')"
					/>
				</div>

				<div class="flex justify-end items-center">
					<Button type="submit" :label="getText('Save')" />
				</div>
			</form>
		</template>
	</Card>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Card from 'primevue/card'
import ToggleSwitch from 'primevue/toggleswitch'
import Textarea from 'primevue/textarea'

import MultiSelect from 'primevue/multiselect'
import { useAiContexts } from '@/components/aiContexts/useAiContexts'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getText } from '@/lang/getText'
import { BOT_NAME } from '@/modules/bots/Bot'

const route = useRoute()
const router = useRouter()
const { aiContexts, getAll, save } = useAiContexts()

const id = String(route.params.id)

const context = ref<{
	id?: string
	name: string
	content: string
	enabledInBots: BOT_NAME[]
	exclusive: boolean
	enabled: boolean
	createdAt?: number
}>({
	id: undefined,
	name: '',
	content: '',
	enabled: false,
	exclusive: false,
	enabledInBots: [],
	createdAt: undefined
})

const botNames = ref<{ name: string; value: string }[]>(
	Object.values(BOT_NAME).map(aiContext => ({ name: aiContext, value: aiContext }))
)

// ===================================
// Form
// ===================================
const submit = async (e: Event) => {
	e.preventDefault()
	if (!context.value) return

	await save(context.value)

	router.push({ name: 'Contexts' })
}

// ===================================
// Load context
// ===================================
const loadContext = async () => {
	if (!id) return
	if (!aiContexts.value.length) await getAll()
	const ctx = aiContexts.value.find(ctx => ctx.id === id)
	if (ctx) {
		context.value = ctx
	}
}

onMounted(async () => {
	await loadContext()
})
</script>
