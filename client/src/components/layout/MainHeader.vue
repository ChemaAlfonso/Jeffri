<template>
	<div class="p-3">
		<Menubar :model="items">
			<template #start> Jeffri </template>
			<template #end>
				<LangSwitcher />
				<DarkMode />
			</template>
		</Menubar>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Menubar from 'primevue/menubar'
import { useUser } from '@/components/users/useUser'
import { getText } from '@/lang/getText'
import DarkMode from '@/components/layout/DarkMode.vue'
import LangSwitcher from '@/components/layout/LangSwitcher.vue'

const { logoutUser } = useUser()

const logout = () => {
	logoutUser()
}

const router = useRouter()

const items = ref([
	{
		label: getText('Bots'),
		icon: 'pi pi-android',
		command: () => router.push({ name: 'Bots' })
	},
	{
		label: getText('Contexts'),
		icon: 'pi pi-folder-open',
		command: () => router.push({ name: 'Contexts' })
	},
	{
		label: getText('Contacts'),
		icon: 'pi pi-id-card',
		command: () => router.push({ name: 'Contacts' })
	},
	{
		label: getText('Settings'),
		icon: 'pi pi-cog',
		command: () => router.push({ name: 'Settings' })
	},
	{
		label: getText('Sign out'),
		icon: 'pi pi-sign-out',
		command: () => logout()
	}
])
</script>
