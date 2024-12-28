<template>
	<div v-show="whatsappData.qr">
		<span class="text-surface-500 dark:text-surface-400 block mb-8">{{
			getText('Scan the QR code to login')
		}}</span>

		<div class="mb-8 flex items-center justify-center">
			<canvas ref="canvas" class="w-full"></canvas>
		</div>
	</div>

	<div v-if="whatsappData.failed">
		<span class="text-surface-500 dark:text-surface-400 block mb-8">
			{{ getText('Cannot login to Whatsapp, please retry...') }}
		</span>
	</div>

	<div v-else-if="!whatsappData.qr" class="flex items-center justify-center mb-8">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="animate-spin"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<path d="M12 6l0 -3" />
			<path d="M16.25 7.75l2.15 -2.15" />
			<path d="M18 12l3 0" />
			<path d="M16.25 16.25l2.15 2.15" />
			<path d="M12 18l0 3" />
			<path d="M7.75 16.25l-2.15 2.15" />
			<path d="M6 12l-3 0" />
			<path d="M7.75 7.75l-2.15 -2.15" />
		</svg>
	</div>

	<div class="flex justify-end gap-2">
		<Button type="button" :label="getText('Cancel')" severity="secondary" @click="cancel"></Button>
	</div>
</template>

<script setup lang="ts">
import { useBotLogin } from '@/components/bots/logins/useBotLogin'
import Button from 'primevue/button'
import { getText } from '@/lang/getText'
import { onMounted, ref, watch } from 'vue'
import { toCanvas } from 'qrcode'
import { BOT_NAME } from '@/modules/bots/Bot'

const { whatsappData, resetWhatsappLogin } = useBotLogin()

const emit = defineEmits(['cancel', 'done'])

const canvas = ref<HTMLCanvasElement | undefined>()

const cancel = () => {
	resetWhatsappLogin()
	emit('cancel', BOT_NAME.WHATSAPP)
}

const printQr = (qr: string) => {
	if (!canvas.value) return
	toCanvas(canvas.value, qr, { width: 200 })
}

watch(
	() => whatsappData.value.qr,
	newQr => {
		if (newQr) {
			printQr(newQr)
		}
	}
)

watch(
	() => whatsappData.value.isLoggingIn,
	isLoggingIn => {
		if (!isLoggingIn) emit('done')
	}
)

onMounted(() => {
	if (whatsappData.value.qr) printQr(whatsappData.value.qr)
})
</script>
