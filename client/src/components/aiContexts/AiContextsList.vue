<template>
	<div>
		<Button
			:label="getText('Create')"
			size="small"
			icon="pi pi-plus"
			@click="router.push({ name: 'Context' })"
			class="mb-4"
		/>
		<DataTable
			size="small"
			v-model:expandedRows="expandedRows"
			:value="aiContexts"
			tableStyle="min-width: 50rem"
			paginator
			:rows="50"
			:rowsPerPageOptions="[5, 10, 20, 50]"
			edit-mode="cell"
			@cell-edit-complete="onCellEditComplete"
		>
			<Column expander style="width: 5rem" />
			<Column field="name" :header="getText('Name')">
				<template #editor="slotProps">
					<InputText v-model="slotProps.data.name" />
				</template>
			</Column>
			<Column field="exclusive" :header="getText('Exclusive')">
				<template #body="slotProps">
					<ToggleSwitch v-model="slotProps.data.exclusive" @change="save(slotProps.data)" />
				</template>
			</Column>
			<Column field="enabled" :header="getText('Enabled')">
				<template #body="slotProps">
					<ToggleSwitch v-model="slotProps.data.enabled" @change="save(slotProps.data)" />
				</template>
			</Column>

			<Column field="enabledInBots" :header="getText('Used in')">
				<template #body="slotProps">
					<span>
						{{ slotProps.data.enabledInBots.join(', ') }}
					</span>
				</template>
				<template #editor="slotProps">
					<MultiSelect
						@change="save(slotProps.data)"
						v-model="slotProps.data.enabledInBots"
						:options="botNames"
						option-label="name"
						option-value="value"
						placeholder="Select bots"
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
							@click="deleteAiContext(slotProps.data)"
						/>
						<Button
							text
							severity="primary"
							rounded
							size="small"
							icon="pi pi-pencil"
							@click="editAiContext(slotProps.data)"
						/>
					</div>
				</template>
			</Column>

			<template #expansion="slotProps">
				<!--  Handlers -->
				<div class="mt-8 mb-12 px-3">
					<p>
						{{ slotProps.data.content }}
					</p>
				</div>
			</template>
		</DataTable>
	</div>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ToggleSwitch from 'primevue/toggleswitch'
import MultiSelect from 'primevue/multiselect'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { ref } from 'vue'
import { getText } from '@/lang/getText'
import type { AiContext } from '@/modules/aiContexts/AiContext'
import { useAiContexts } from '@/components/aiContexts/useAiContexts'
import { BOT_NAME } from '@/modules/bots/Bot'
import { useRouter } from 'vue-router'

const router = useRouter()

interface AiContextListProps {
	aiContexts: AiContext[]
}

const props = defineProps<AiContextListProps>()

const { save, remove } = useAiContexts()

const expandedRows = ref<AiContext[]>([...props.aiContexts])

const botNames = ref<{ name: string; value: string }[]>(
	Object.values(BOT_NAME).map(aiContext => ({ name: aiContext, value: aiContext }))
)
// const botNames = ref<string[]>(Object.values(BOT_NAME).map(aiContext => aiContext))

const deleteAiContext = async (aiContext: AiContext) => {
	const confirmed = confirm('Are you sure you want to delete this AI context?')
	if (!confirmed) return
	await remove(aiContext.id)
}

const editAiContext = async (aiContext: AiContext) => {
	router.push({ name: 'Context', params: { id: aiContext.id } })
}

const onCellEditComplete = async (e: { field: string; data: AiContext; newData: AiContext }) => {
	await save(e.newData)
}
</script>
