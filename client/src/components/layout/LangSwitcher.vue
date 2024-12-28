<template>
	<Select
		required
		v-model="selectedLang"
		:options="langs"
		option-label="label"
		option-value="value"
		:placeholder="getText('Select contexts')"
		:maxSelectedLabels="3"
		class="w-12"
		:pt="{
			dropdown: {
				class: ['!hidden']
			},
			label: {
				class: ['!bg-surface-0', 'dark:!bg-surface-950']
			},
			root: {
				class: ['!border-0', '!shadow-none']
			}
		}"
		@change="setLang(selectedLang)"
	/>
</template>

<script setup lang="ts">
import Select from 'primevue/select'
import { getText } from '@/lang/getText'
import { useLang } from '@/modules/shared/application/useLang'
import { LANG } from '@/modules/shared/domain/Lang'
import { ref } from 'vue'

const { lang, setLang } = useLang()

const langs = ref([
	{
		label: '🇪🇸',
		value: LANG.ES
	},
	{
		label: '🇺🇸',
		value: LANG.EN
	},
	{
		label: '🇫🇷',
		value: LANG.FR
	},
	{
		label: '🇮🇹',
		value: LANG.IT
	},
	{
		label: '🇩🇪',
		value: LANG.DE
	}
])
const selectedLang = ref(lang.value)
</script>
