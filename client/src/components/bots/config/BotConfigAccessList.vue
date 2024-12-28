<template>
	<div class="mb-12">
		<h2 class="mb-4">
			{{ getText('Set from existing contact') }}
		</h2>
		<Select
			required
			v-model="selectedContact"
			:filter="true"
			:options="contacts"
			option-label="name"
			option-value="id"
			:placeholder="getText('Select a contact')"
			:maxSelectedLabels="3"
			class="w-full md:w-80"
			:empty-filter-message="getText('No contacts found')"
			:empty-message="getText('No contacts available')"
			@change="setValueFromSelectedContact"
		/>
	</div>
	<Divider />
	<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
		<div>
			<h2 class="text-2xl mb-4 font-bold flex items-center justify-start gap-2">
				<span>{{ getText('Allow list for') }}</span>
				<span class="capitalize">{{ bot.name }}</span>
			</h2>
			<div class="mb-12">
				<div class="text-gray-500 text-xs mb-1">
					{{
						getText(
							'Allow list of handlers that can interact with the bot. If the list is empty, all handlers can interact with the bot. If the list is not empty, only the handlers in the list can interact with the bot.'
						)
					}}
				</div>
			</div>
			<div class="mb-8">
				<label class="block text-sm mb-2" for="name">{{ getText('Add a new handler') }}</label>
				<div class="flex items-center gap-4">
					<InputText
						:placeholder="getText('Handler')"
						class="w-full flex-grow"
						required
						v-model="whitelistInput"
					/>
					<Button
						class="flex-shrink-0"
						text
						type="button"
						icon="pi pi-plus"
						@click="addToList('whitelist')"
					/>
				</div>
			</div>
			<div>
				<ul>
					<li
						v-for="item in whitelist"
						:key="item"
						class="flex items-center justify-between gap-4 p-1 hover:bg-surface-50 dark:hover:bg-surface-900 rounded-md"
					>
						<div>
							{{ getContactFromHandler(item) }}
						</div>
						<div>
							<Button
								text
								size="small"
								severity="danger"
								type="button"
								icon="pi pi-trash"
								@click="removeFromList('whitelist', item)"
							/>
						</div>
					</li>
				</ul>
			</div>
		</div>

		<div>
			<h2 class="text-2xl mb-4 font-bold flex items-center justify-start gap-2">
				<span>{{ getText('Deny list for') }}</span>
				<span class="capitalize">{{ bot.name }}</span>
			</h2>
			<div class="mb-12">
				<div class="text-gray-500 text-xs mb-1">
					{{
						getText(
							'Deny list of handlers that cannot interact with the bot. If the list is empty, all handlers can interact with the bot. If the list is not empty, only the handlers not in the list can interact with the bot.'
						)
					}}
				</div>
			</div>
			<div class="mb-8">
				<label class="block text-sm mb-2" for="name">{{ getText('Add a new handler') }}</label>
				<div class="flex items-center gap-4">
					<InputText
						:placeholder="getText('Handler')"
						class="w-full flex-grow"
						required
						v-model="blacklistInput"
					/>
					<Button
						class="flex-shrink-0"
						text
						type="button"
						icon="pi pi-plus"
						@click="addToList('blacklist')"
					/>
				</div>
			</div>
			<div>
				<ul>
					<li
						v-for="item in blacklist"
						:key="item"
						class="flex items-center justify-between gap-4 p-1 hover:bg-surface-50 dark:hover:bg-surface-900 rounded-md"
					>
						<div>
							{{ getContactFromHandler(item) }}
						</div>
						<div>
							<Button
								text
								size="small"
								severity="danger"
								type="button"
								icon="pi pi-trash"
								@click="removeFromList('blacklist', item)"
							/>
						</div>
					</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Divider from 'primevue/divider'
import { useToast } from 'primevue/usetoast'
import type { Bot } from '@/modules/bots/Bot'
import { onMounted, ref } from 'vue'
import { getText } from '@/lang/getText'
import { useContacts } from '@/components/contacts/useContacts'

const { contacts, getAll } = useContacts()
const toast = useToast()

interface BotAccessListProps {
	bot: Bot
}

const props = defineProps<BotAccessListProps>()
const emit = defineEmits(['accessListChange'])

const whitelist = ref<string[]>(props.bot.whitelist)
const blacklist = ref<string[]>(props.bot.blacklist)

const selectedContact = ref<string>('')
const whitelistInput = ref('')
const blacklistInput = ref('')

const onChange = () => {
	emit('accessListChange', { whitelist: whitelist.value, blacklist: blacklist.value })
}

const addToList = (listName: string) => {
	if (listName === 'whitelist') {
		if (whitelist.value.includes(whitelistInput.value)) {
			toast.add({
				severity: 'warn',
				summary: getText('Already exists'),
				detail: getText('The handler is already in the allow list, skipping...'),
				life: 5000
			})
			return
		}
		whitelist.value.push(whitelistInput.value)
		whitelistInput.value = ''
	} else {
		if (blacklist.value.includes(blacklistInput.value)) {
			toast.add({
				severity: 'warn',
				summary: getText('Already exists'),
				detail: getText('The handler is already in the allow list, skipping...'),
				life: 5000
			})
			return
		}
		blacklist.value.push(blacklistInput.value)
		blacklistInput.value = ''
	}

	onChange()
}

const removeFromList = (listName: string, item: string) => {
	if (listName === 'whitelist') {
		whitelist.value.splice(whitelist.value.indexOf(item), 1)
	} else {
		blacklist.value.splice(blacklist.value.indexOf(item), 1)
	}

	onChange()
}

const getContactFromHandler = (handler: string) => {
	return (
		contacts.value.find(contact => contact.botHandlers[props.bot.name] === handler)?.name ??
		`${handler} (Not in contacts)`
	)
}

const setValueFromSelectedContact = () => {
	if (!selectedContact.value) return

	const contact = contacts.value.find(contact => contact.id === selectedContact.value)

	if (!contact) return

	const handler = contact.botHandlers[props.bot.name]

	whitelistInput.value = handler || ''
	blacklistInput.value = handler || ''
}

// ===================================
// Load data
// ===================================
const loadContacts = async () => {
	if (!contacts.value.length) await getAll()
}

onMounted(() => {
	loadContacts()
})
</script>
