import { useApi } from '@/modules/connection/Api'
import type { Contact } from '@/modules/contacts/Contact'
import { contactsStore } from '@/components/contacts/ContactsStore'
import type { BOT_NAME } from '@/modules/bots/Bot'
import { storeToRefs } from 'pinia'
import { v4 } from 'uuid'

export const useContacts = () => {
	const { contacts } = storeToRefs(contactsStore())
	const { saveContact, removeContact, clearContacts, sortContacts } = contactsStore()
	const { getContacts, saveContact: saveContactOnServer, removeContact: removeContactOnServer } = useApi()

	const getAll = async () => {
		clearContacts()

		const fetchedContacts = await getContacts()

		fetchedContacts.forEach(context => {
			saveContact(context)
		})

		sortContacts()

		return contacts.value
	}

	const save = async (params: {
		id?: string
		name: string
		avatar: string
		botHandlers: { [key in BOT_NAME]?: string }
		createdAt?: number
		contexts: string[]
	}) => {
		const contact = {
			...params,
			id: params.id || v4(),
			createdAt: params.createdAt || new Date().getTime()
		}

		await saveContactOnServer(contact)
		saveContact(contact)
		sortContacts()
	}

	const remove = async (id: string) => {
		await removeContactOnServer(id)
		removeContact(id)
	}

	return {
		contacts,
		getAll,
		save,
		remove
	}
}
