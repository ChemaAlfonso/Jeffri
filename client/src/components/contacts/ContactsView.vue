<template>
	<div>
		<ContactsList :contacts="contacts" />
	</div>
</template>

<script setup lang="ts">
import ContactsList from '@/components/contacts/ContactsList.vue'
import { useContacts } from '@/components/contacts/useContacts'

const { contacts, getAll } = useContacts()

getAll()
</script>
