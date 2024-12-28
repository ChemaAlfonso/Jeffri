import { getText } from '@/lang/getText'
import { BOT_NAME } from '@/modules/bots/Bot'
import { ref } from 'vue'

export const useHelp = () => {
	const handlerHelps = ref<Record<BOT_NAME, string>>({
		telegram: getText('The username or phone number of the user.'),
		whatsapp: getText('The phone number of the user.')
	})

	const getBotHandlerHelp = (bot: BOT_NAME) => {
		if (handlerHelps.value?.[bot]) return handlerHelps.value[bot]

		return ''
	}

	return {
		getBotHandlerHelp
	}
}
