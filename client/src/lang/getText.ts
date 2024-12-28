import translations from '@/lang/translations.json'
import { useLang } from '@/modules/shared/application/useLang'

const { lang } = useLang()
export const getText = (text: string) => {
	const t = translations as Record<string, Record<string, string>>
	return t?.[text]?.[lang.value] || text
}
