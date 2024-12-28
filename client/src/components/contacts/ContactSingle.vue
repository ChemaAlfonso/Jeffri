<template>
	<Card>
		<template #content>
			<form @submit="submit" v-if="contact">
				<div class="flex items-center justify-center gap-4 mb-12">
					<div class="flex items-center gap-4 w-24 h-24">
						<img :src="avatar" alt="avatar" class="object-contain" />
					</div>
				</div>
				<div class="mb-8">
					<label class="block text-sm mb-2" for="name">{{ getText('Name') }}</label>
					<InputText class="w-full md:w-80" required v-model="contact.name" />
				</div>

				<div class="mb-8">
					<ul class="text-sm">
						<li
							class="gap-2 mb-4"
							v-for="[bot, handler] in formatedHandlers(contact.botHandlers)"
							:key="String(handler)"
						>
							<div class="font-semibold capitalize mb-2">{{ bot }}</div>
							<div class="text-gray-500 text-xs mb-1">{{ getBotHandlerHelp(bot) }}</div>
							<InputText
								class="w-full md:w-80"
								@blur="updateContactHandler(String(bot), String(handler))"
								:value="handler"
							/>
						</li>
					</ul>
				</div>

				<div class="mb-8">
					<label class="block text-sm mb-2" for="enabledInBots">{{ getText('Custom contexts') }}</label>
					<MultiSelect
						required
						:filter="true"
						v-model="contact.contexts"
						:options="aiContexts"
						option-label="name"
						option-value="id"
						:placeholder="getText('Select contexts')"
						:empty-filter-message="getText('No contexts found')"
						:empty-message="getText('No contexts available')"
						:maxSelectedLabels="3"
						class="w-full md:w-80"
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

import MultiSelect from 'primevue/multiselect'
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getText } from '@/lang/getText'
import { BOT_NAME } from '@/modules/bots/Bot'
import { useContacts } from '@/components/contacts/useContacts'
import { useAiContexts } from '@/components/aiContexts/useAiContexts'
import { useAvatars } from '@/modules/contacts/useAvatars'
import { useHelp } from '@/components/bots/useHelp'

const route = useRoute()
const router = useRouter()
const { contacts, getAll, save } = useContacts()
const { aiContexts, getAll: getAllAiContexts } = useAiContexts()
const { generate: generateAvatar } = useAvatars()
const { getBotHandlerHelp } = useHelp()

const id = String(route.params.id)

const contact = ref<{
	id?: string
	name: string
	avatar: string
	botHandlers: { [key in BOT_NAME]?: string }
	createdAt?: number
	contexts: string[]
}>({
	id: undefined,
	name: '',
	avatar: '',
	botHandlers: Object.values(BOT_NAME).reduce((acc, bot) => ({ ...acc, [bot]: '' }), {}),
	contexts: [],
	createdAt: undefined
})

const avatar = ref(contact.value?.avatar || generateAvatar(contact.value.name))

const formatedHandlers = (contactHandlers: { [key in BOT_NAME]?: string }) => {
	const allHandlerKeys = Object.values(BOT_NAME)
	allHandlerKeys.forEach(bot => {
		if (!contactHandlers[bot]) {
			contactHandlers[bot] = ''
		}
	})
	return Object.entries(contactHandlers) as [BOT_NAME, string][]
}

// ===================================
// Form
// ===================================
const updateContactHandler = async (botName: string, handler: string) => {
	contact.value.botHandlers[botName as BOT_NAME] = handler
}

const submit = async (e: Event) => {
	e.preventDefault()
	if (!contact.value) return

	await save({ ...contact.value, avatar: avatar.value })

	router.push({ name: 'Contacts' })
}

// ===================================
// Load contact
// ===================================
const loadContact = async () => {
	if (!id) return
	if (!contacts.value.length) await getAll()
	const cntact = contacts.value.find(cntact => cntact.id === id)
	if (cntact) {
		contact.value = cntact
		avatar.value = cntact.avatar
	}
}

const loadContexts = async () => {
	if (!aiContexts.value.length) await getAllAiContexts()
}

watch(
	() => contact.value.name,
	() => {
		if (!contact.value.avatar) avatar.value = generateAvatar(contact.value.name)
	}
)

onMounted(async () => {
	await loadContexts()
	await loadContact()
})
</script>
