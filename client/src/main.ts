import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'
import ToastService from 'primevue/toastservice'

import App from './App.vue'
import router from './router'

import { vGettext } from '@/lang/v-gettext'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
	theme: {
		preset: Aura,
		options: {
			darkModeSelector: '.dark'
		}
	}
})
app.directive('gettext', vGettext)
app.use(ToastService)

app.mount('#app')
