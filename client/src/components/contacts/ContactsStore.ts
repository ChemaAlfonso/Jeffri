// src/stores/chatsStore.ts
import type { Contact } from '@/modules/contacts/Contact'
import { BOT_NAME } from '@/modules/bots/Bot'
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

export const contactsStore = defineStore('ContactsStore', () => {
	const contacts: Ref<Contact[]> = ref([])

	const saveContact = (newContact: Contact) => {
		const emptyProviderIds = Object.values(BOT_NAME).reduce((acc, provider) => {
			acc[provider] = ''
			return acc
		}, {} as { [key in BOT_NAME]?: string })

		newContact.botHandlers = { ...emptyProviderIds, ...newContact.botHandlers }

		const existingContacts = contacts.value.find(contact => contact.id === newContact.id)
		if (existingContacts) {
			Object.assign(existingContacts, newContact)
			return
		}

		contacts.value.push(newContact)
	}

	const removeContact = (id: string) => {
		const index = contacts.value.findIndex(contact => contact.id === id)
		if (index === -1) return

		contacts.value.splice(index, 1)
	}

	const sortContacts = () => {
		contacts.value.sort((a: Contact, b: Contact) => {
			return a.name.localeCompare(b.name)
		})
	}

	const clearContacts = () => {
		contacts.value = []
	}

	return {
		contacts,
		saveContact,
		removeContact,
		clearContacts,
		sortContacts
	}
})
