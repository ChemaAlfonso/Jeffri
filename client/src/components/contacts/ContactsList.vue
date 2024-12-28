<template>
	<div>
		<Button
			:label="getText('Create')"
			size="small"
			icon="pi pi-plus"
			@click="router.push({ name: 'Contact' })"
			class="mb-4"
		/>
		<DataTable
			size="small"
			v-model:expandedRows="expandedRows"
			:value="contacts"
			tableStyle="min-width: 50rem"
			paginator
			:rows="50"
			:rowsPerPageOptions="[5, 10, 20, 50]"
			edit-mode="cell"
			@cell-edit-complete="onCellEditComplete"
		>
			<Column expander style="width: 5rem" />

			<Column field="avatar" :header="getText('Avatar')">
				<template #body="slotProps">
					<div class="flex items-center justify-center w-8 h-8">
						<img :src="slotProps.data.avatar" alt="avatar" class="object-contain" />
					</div>
				</template>
			</Column>

			<Column field="name" :header="getText('Name')">
				<template #editor="slotProps">
					<InputText v-model="slotProps.data.name" />
				</template>
			</Column>

			<Column field="contexts" :header="getText('Contexts')">
				<template #body="slotProps">
					<span>
						{{ getContextNames(slotProps.data.contexts).join(', ') }}
					</span>
				</template>
				<template #editor="slotProps">
					<MultiSelect
						@change="save(slotProps.data)"
						v-model="slotProps.data.contexts"
						:options="aiContexts"
						:filter="true"
						option-label="name"
						option-value="id"
						:placeholder="getText('Select contexts')"
						:empty-filter-message="getText('No contexts found')"
						:empty-message="getText('No contexts available')"
						:maxSelectedLabels="3"
						class="w-full md:w-80"
					/>
				</template>
			</Column>

			<Column field="" :header="getText('Actions')">
				<template #body="slotProps">
					<div class="flex justify-start items-center gap-2">
						<Button
							text
							severity="danger"
							rounded
							size="small"
							icon="pi pi-trash"
							@click="deleteContact(slotProps.data)"
						/>
						<Button
							text
							severity="primary"
							rounded
							size="small"
							icon="pi pi-pencil"
							@click="editContact(slotProps.data)"
						/>
					</div>
				</template>
			</Column>

			<template #expansion="slotProps">
				<!--  Handlers -->
				<div class="mt-8 mb-12 px-3">
					<ul class="text-sm">
						<li
							class="gap-2 mb-4"
							v-for="[bot, handler] in formatedHandlers(slotProps.data.botHandlers)"
							:key="slotProps.data.id + bot"
						>
							<div class="font-semibold capitalize mb-2">{{ bot }}</div>
							<div class="text-gray-500 text-xs mb-1">{{ getBotHandlerHelp(bot) }}</div>
							<InputText
								class="w-full md:w-80"
								@blur="updateContactHandler(slotProps.data.id, bot, handler)"
								v-model="slotProps.data.botHandlers[bot]"
							/>
						</li>
					</ul>
				</div>
			</template>
		</DataTable>
	</div>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import MultiSelect from 'primevue/multiselect'
import InputText from 'primevue/inputtext'
import { useContacts } from '@/components/contacts/useContacts'
import type { Contact } from '@/modules/contacts/Contact'
import { onMounted, ref } from 'vue'
import { getText } from '@/lang/getText'
import { BOT_NAME } from '@/modules/bots/Bot'
import { useRouter } from 'vue-router'
import { useAiContexts } from '@/components/aiContexts/useAiContexts'
import { useHelp } from '@/components/bots/useHelp'

const router = useRouter()

interface ContactListProps {
	contacts: Contact[]
}

const props = defineProps<ContactListProps>()

const { save, remove } = useContacts()
const { getAll: getAllAiContexts, aiContexts } = useAiContexts()
const { getBotHandlerHelp } = useHelp()

const expandedRows = ref<Contact[]>([...props.contacts])

const formatedHandlers = (handlers: { [key in BOT_NAME]?: string }) => {
	const allHandlerKeys = Object.values(BOT_NAME)
	allHandlerKeys.forEach(bot => {
		if (!handlers[bot]) {
			handlers[bot] = ''
		}
	})
	return Object.entries(handlers) as [BOT_NAME, string][]
}

const getContextNames = (ids: string[]) => {
	const context = aiContexts.value.filter(context => ids.includes(context.id))
	return context.map(context => context.name)
}

// ===================================
// CRUD
// ===================================
const updateContactHandler = async (id: string, botName: string, handler: string) => {
	const contact = props.contacts.find(contact => contact.id === id)

	if (!contact) return

	const updatedContact = {
		...contact,
		botHandlers: {
			...contact.botHandlers,
			[botName]: handler
		}
	}

	await save(updatedContact)
}

const deleteContact = async (contact: Contact) => {
	const confirmed = confirm('Are you sure you want to delete this contact?')
	if (!confirmed) return
	await remove(contact.id)
}

const editContact = async (contact: Contact) => {
	router.push({ name: 'Contact', params: { id: contact.id } })
}

const onCellEditComplete = async (e: { field: string; data: Contact; newData: Contact }) => {
	await save(e.newData)
}

const loadAiContexts = async () => {
	if (aiContexts.value.length) return
	await getAllAiContexts()
}

onMounted(() => {
	loadAiContexts()
})
</script>
