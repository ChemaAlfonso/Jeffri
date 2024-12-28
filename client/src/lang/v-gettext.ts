import { getText } from '@/lang/getText'

export const vGettext = {
	mounted: (el: HTMLElement) => {
		const contentProperty: 'textContent' | 'innerText' = el.textContent ? 'textContent' : 'innerText'
		const text: string = el[contentProperty] || ''
		el[contentProperty] = getText(text)
	}
}
