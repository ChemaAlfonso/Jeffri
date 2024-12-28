<template>
	<Button severity="contrast" variant="text" rounded size="small" :icon="icon" @click="toggleDarkMode()" />
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import { computed, ref } from 'vue'

const isDarkModeEnabled = ref(document.documentElement.classList.contains('dark'))
const icon = computed(() => (isDarkModeEnabled.value ? 'pi pi-sun' : 'pi pi-moon'))

const toggleDarkMode = () => {
	document.documentElement.classList.toggle('dark')
	isDarkModeEnabled.value = !isDarkModeEnabled.value
	localStorage.setItem('darkMode', isDarkModeEnabled.value.toString())
}

if (localStorage.getItem('darkMode') === 'true') {
	document.documentElement.classList.add('dark')
	isDarkModeEnabled.value = true
}
</script>
