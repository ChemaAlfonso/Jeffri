<template>
	<Dialog
		v-model:visible="visible"
		modal
		:header="getText('Required action')"
		:style="{ maxWidth: '25rem', width: '95dvw' }"
		:closable="false"
	>
		<BotLoginTelegram
			@done="emit('loginCompleted', BOT_NAME.TELEGRAM)"
			v-if="telegramLoginRequiresAttention"
			@cancel="onCancelLogin"
		/>
		<BotLoginWhatsapp
			@done="emit('loginCompleted', BOT_NAME.WHATSAPP)"
			v-if="whatsappLoginRequiresAttention"
			@cancel="onCancelLogin"
		/>
	</Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { ref, watch } from 'vue'
import { getText } from '@/lang/getText'
import BotLoginTelegram from '@/components/bots/logins/BotLoginTelegram.vue'

import { useBotLogin } from '@/components/bots/logins/useBotLogin'
import BotLoginWhatsapp from '@/components/bots/logins/BotLoginWhatsapp.vue'
import { BOT_NAME } from '@/modules/bots/Bot'
import { useBots } from '@/components/bots/useBots'

const { loginRequiresAttention, telegramLoginRequiresAttention, whatsappLoginRequiresAttention } = useBotLogin()
const { bots, turnOff } = useBots()

const emit = defineEmits(['loginCompleted'])

const visible = ref(false)

const onCancelLogin = (botName: BOT_NAME) => {
	visible.value = false

	// Cancel requires turning off the bot to prevent
	// unclosed connections handled by sockets
	const bot = bots.value.find(bot => bot.name === botName)
	if (bot) turnOff(bot)
}

watch(loginRequiresAttention, value => {
	visible.value = Boolean(value)
})
</script>
