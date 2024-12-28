<template>
	<div v-if="bot">
		<BotConfigAccessList :bot="bot" @access-list-change="updateAccessList" />
	</div>
</template>

<script setup lang="ts">
import BotConfigAccessList from '@/components/bots/config/BotConfigAccessList.vue'
import { useBots } from '@/components/bots/useBots'
import { BOT_NAME, type Bot } from '@/modules/bots/Bot'
import { onMounted, ref } from 'vue'

const { bots, getAll, botWithName, save } = useBots()

const bot = ref<Bot>()

const updateAccessList = (params: { whitelist: string[]; blacklist: string[] }) => {
	if (!bot.value) return
	const { whitelist, blacklist } = params

	bot.value.whitelist = whitelist
	bot.value.blacklist = blacklist
	save(bot.value)
}

// ===================================
// Loading
// ===================================
const loadBots = async () => {
	if (!bots.value.length) await getAll()
}

const loadBot = async () => {
	await loadBots()
	bot.value = botWithName(BOT_NAME.TELEGRAM)
}

onMounted(() => {
	loadBot()
})
</script>
