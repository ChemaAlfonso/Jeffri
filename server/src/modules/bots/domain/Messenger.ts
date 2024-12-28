import { User } from '../../users/domain/User.js'
import { Message } from './Message.js'

export interface MessengerEnchancedServicesCapabilities {
	enableImageGeneration: boolean
	enableImagesVisor: boolean
	enableTranscriptions: boolean
}

export interface Messenger {
	connect(user: User): Promise<void>
	disconnect(user: User): Promise<void>
	logout(user: User): Promise<void>
	isConnected(user: User): Promise<boolean>
	sendMessage(user: User, message: Message): Promise<void>
}
