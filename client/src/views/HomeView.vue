<template>
	<MainHeader />

	<div class="flex gap-2 p-4 max-w-[1200px] mx-auto">
		<main class="w-full">
			<RouterView />
		</main>
	</div>
</template>

<script setup lang="ts">
import MainHeader from '@/components/layout/MainHeader.vue'
import { getText } from '@/lang/getText'

const showConfigAlert = () => {
	const configAlert = localStorage.getItem('configAlert')

	if (configAlert === 'false') return

	const rememberConfigSet = confirm(
		getText(
			'Please ensure you have configured the AI settings before using the bots or the service will not work. Press OK to no remind you again.'
		)
	)

	if (rememberConfigSet) localStorage.setItem('configAlert', 'false')
}

showConfigAlert()
</script>
