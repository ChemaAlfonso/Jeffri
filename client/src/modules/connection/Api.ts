import type { AiConfig } from '@/modules/aiConfig/AiConfig'
import type { AiContext } from '@/modules/aiContexts/AiContext'
import { BOT_STATUS, type Bot } from '@/modules/bots/Bot'
import type { Contact } from '@/modules/contacts/Contact'
import type { User } from '@/modules/user/User'

const apiURL = import.meta.env.VITE_API_URL

export const useApi = () => {
	const apiRequest = async (endpoint: string, method: string, body?: any) => {
		const url = `${apiURL}/${endpoint}`

		const requestArgs: RequestInit = {
			method,
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body),
			credentials: 'include'
		}

		const response = await fetch(url, requestArgs)

		if (!response.ok) {
			const errorMessage = (await response.json()).error || 'Error en la petición'
			throw new Error(errorMessage)
		}

		return await response.json()
	}

	const login = async (username: string, password: string): Promise<{ id: string }> => {
		try {
			const response = await apiRequest('login', 'POST', { username, password })
			const { id } = response?.data
			return { id }
		} catch (err) {
			throw new Error('Credenciales incorrectas')
		}
	}

	const register = async (user: User): Promise<string> => {
		try {
			const response = await apiRequest(`register/${user.id}`, 'PUT', user)
			const { token } = response?.data
			return token
		} catch (err) {
			console.log(err)
			const errorMessage = err instanceof Error ? err.message : 'Error al crear el contacto'
			throw new Error(errorMessage)
		}
	}

	const getUser = async (id: string): Promise<User> => {
		try {
			const response = await apiRequest(`users/${id}`, 'GET')
			const userResponse: Omit<User, 'username'> = response?.data.user
			return {
				...userResponse,
				username: response?.data.email
			}
		} catch (err) {
			throw new Error('Error al obtener el usuario')
		}
	}

	const refreshAuthToken = async (): Promise<boolean> => {
		try {
			const respose = await apiRequest('users/auth/refresh', 'GET')
			return respose?.ok === true
		} catch (err) {
			throw new Error('Error al refrescar el token')
		}
	}

	// ===================================
	// Bots
	// ===================================
	const startBot = async (bot: Bot): Promise<void> => {
		const botIdEndpointMap: Record<string, string> = {
			whatsapp: 'wa',
			telegram: 'tg'
		}

		try {
			await apiRequest(`bots/messengers/start${botIdEndpointMap[bot.name]}`, 'GET')
		} catch (err) {
			throw new Error('Error al iniciar el bot')
		}
	}

	const stopBot = async (bot: Bot): Promise<void> => {
		const botIdEndpointMap: Record<string, string> = {
			whatsapp: 'wa',
			telegram: 'tg'
		}

		try {
			await apiRequest(`bots/messengers/stop${botIdEndpointMap[bot.name]}`, 'GET')
		} catch (err) {
			throw new Error('Error al detener el bot')
		}
	}

	const logoutBot = async (bot: Bot): Promise<void> => {
		const botIdEndpointMap: Record<string, string> = {
			whatsapp: 'wa',
			telegram: 'tg'
		}

		try {
			await apiRequest(`bots/messengers/logout${botIdEndpointMap[bot.name]}`, 'GET')
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error al cerrar el bot'
			throw new Error(errorMessage)
		}
	}

	const getBotStatus = async (bot: Bot): Promise<BOT_STATUS> => {
		const botIdEndpointMap: Record<string, string> = {
			whatsapp: 'wa',
			telegram: 'tg'
		}

		try {
			const { data } = await apiRequest(`bots/messengers/${botIdEndpointMap[bot.name]}/status`, 'GET')
			return data.status
		} catch (err) {
			throw new Error('Error al obtener el estado del bot')
		}
	}

	// ===================================
	// Contacts
	// ===================================
	const getContacts = async (): Promise<Contact[]> => {
		try {
			const response = await apiRequest('contacts', 'GET')
			return response?.data?.contacts
		} catch (err) {
			throw new Error('Error al obtener los contactos')
		}
	}

	const saveContact = async (contact: Contact): Promise<void> => {
		try {
			await apiRequest(`contacts/${contact.id}`, 'PUT', contact)
		} catch (err) {
			console.log(err)
			throw new Error('Error al crear el contacto')
		}
	}

	const removeContact = async (id: string): Promise<void> => {
		try {
			await apiRequest(`contacts/${id}`, 'DELETE')
		} catch (err) {
			throw new Error('Error al eliminar el contacto')
		}
	}

	// ===================================
	// AiContexts
	// ===================================
	const getAiContexts = async (): Promise<AiContext[]> => {
		try {
			const response = await apiRequest('aicontexts', 'GET')
			return response?.data.aiContexts
		} catch (err) {
			throw new Error('Error al obtener los contactos')
		}
	}

	const saveAiContext = async (contact: AiContext): Promise<void> => {
		try {
			await apiRequest(`aicontexts/${contact.id}`, 'PUT', contact)
		} catch (err) {
			throw new Error('Error al crear el contacto')
		}
	}

	const removeAiContexts = async (id: string): Promise<void> => {
		try {
			await apiRequest(`aicontexts/${id}`, 'DELETE')
		} catch (err) {
			throw new Error('Error al eliminar el contacto')
		}
	}

	// ===================================
	// AiConfigs
	// ===================================
	const getAiConfig = async (): Promise<AiConfig> => {
		try {
			const response = await apiRequest('modelconfigs/mine', 'GET')
			return response?.data.modelConfig
		} catch (err) {
			throw new Error('Error al obtener la configuración')
		}
	}

	const saveAiConfig = async (config: AiConfig): Promise<void> => {
		try {
			await apiRequest(`modelconfigs/${config.id}`, 'PUT', config)
		} catch (err) {
			throw new Error('Error al crear la configuración')
		}
	}

	const removeAiConfig = async (id: string): Promise<void> => {
		try {
			await apiRequest(`modelconfigs/${id}`, 'DELETE')
		} catch (err) {
			throw new Error('Error al eliminar la configuración')
		}
	}

	// ===================================
	// External messagin providers
	// ===================================
	const getBots = async (): Promise<Bot[]> => {
		try {
			const response = await apiRequest('bots', 'GET')

			const bots: Bot[] = response?.data.bots

			const botsStatus = await Promise.allSettled(bots.map(bot => getBotStatus(bot)))
			bots.forEach((bot, index) => {
				bot.status =
					botsStatus[index].status === 'fulfilled'
						? (botsStatus[index] as PromiseFulfilledResult<BOT_STATUS>).value
						: 'disconnected'
			})

			return bots
		} catch (err) {
			throw new Error('Error al obtener los proveedores externos')
		}
	}

	const saveBot = async (provider: Bot): Promise<void> => {
		try {
			await apiRequest(`bots/${provider.id}`, 'PUT', provider)
		} catch (err) {
			throw new Error('Error al crear el proveedor externo')
		}
	}

	const removeBot = async (id: string): Promise<void> => {
		try {
			await apiRequest(`bots/${id}`, 'DELETE')
		} catch (err) {
			throw new Error('Error al eliminar el proveedor externo')
		}
	}

	return {
		login,
		register,
		refreshAuthToken,
		getUser,
		getContacts,
		saveContact,
		removeContact,
		startBot,
		stopBot,
		logoutBot,
		getBotStatus,
		getAiContexts,
		saveAiContext,
		removeAiContexts,
		getAiConfig,
		saveAiConfig,
		removeAiConfig,
		getBots,
		saveBot,
		removeBot
	}
}
