import { User } from '../../../../users/domain/User.js'
import { Messenger } from '../../../../bots/domain/Messenger.js'
import { Message } from '../../../../bots/domain/Message.js'
import { asyncContainer } from '../../../../../app/di/container.js'
import { CannotLogoutWithoutConnectionDomainError } from '../../../../bots/domain/CannotLogoutWithoutConnectionDomainError.js'

export class WhatsappMessengerManager implements Messenger {
	private instancesMap: Map<string, Messenger> = new Map()

	async connect(user: User): Promise<void> {
		const instance = this.getInstance(user)

		if (instance && (await instance.isConnected(user))) return

		await this.createAndConnectInstance(user)
	}

	async disconnect(user: User): Promise<void> {
		const instance = this.getInstance(user)

		if (!instance) return

		await instance.disconnect(user)

		this.instancesMap.delete(user.id)
	}

	async logout(user: User): Promise<void> {
		const instance = this.getInstance(user)

		if (!instance) throw new CannotLogoutWithoutConnectionDomainError()

		await instance.logout(user)

		this.instancesMap.delete(user.id)
	}

	async sendMessage(user: User, message: Message): Promise<void> {
		const instance = this.getInstance(user)

		if (!instance) {
			throw new Error(
				`[WhatsappMessengerManager] Cannot send message: socket not connected ${JSON.stringify(
					message.receiver.id
				)} ${JSON.stringify(message)}`
			)
		}

		await instance.sendMessage(user, message)
	}

	async isConnected(user: User): Promise<boolean> {
		const instance = this.getInstance(user)

		if (!instance) return false

		return await instance.isConnected(user)
	}

	private async createAndConnectInstance(user: User): Promise<Messenger> {
		const container = await asyncContainer()
		const newInstance = container.get<Messenger>('Chats.WhatsappMessenger')

		await newInstance.connect(user)

		this.instancesMap.set(user.id, newInstance)

		return newInstance
	}

	private getInstance(user: User): Messenger | undefined {
		return this.instancesMap.get(user.id)
	}
}
