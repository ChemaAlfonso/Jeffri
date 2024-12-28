import { ref, type Ref } from 'vue'

import { LANG } from '@/modules/shared/domain/Lang'

const storedLang = (localStorage.getItem('lang') as LANG) || 'es'
const lang = ref(storedLang)

export const useLang = () => {
	const setLang = (selectedLang: LANG) => {
		lang.value = selectedLang
		localStorage.setItem('lang', selectedLang)
		location.reload()
	}

	return {
		lang,
		setLang
	}
}
