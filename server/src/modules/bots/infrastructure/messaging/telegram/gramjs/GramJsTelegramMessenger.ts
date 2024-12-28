import fs from 'fs/promises'
import { Api, TelegramClient } from 'telegram'
import { v4 } from 'uuid'
import { StringSession } from 'telegram/sessions/index.js'
import { User } from '../../../../../users/domain/User.js'
import { Messenger, MessengerEnchancedServicesCapabilities } from '../../../../../bots/domain/Messenger.js'
import {
	Message,
	MESSAGE_STATUS,
	MessageAttachment,
	MessageAttachmentAudio,
	MessageAttachmentImage
} from '../../../../../bots/domain/Message.js'
import { Logger } from '../../../../../shared/domain/Logger.js'
import { serverEventEmitter } from '../../../../../../app/serverEvents.js'
import { NewMessage } from 'telegram/events/NewMessage.js'
import { CHAT_STATE, MessengerProcessor } from '../../MessengerProcessor.js'
import { AvatarProvider } from '../../../../../shared/domain/AvatarProvider.js'
import { BOT_NAME } from '../../../../../bots/domain/Bot.js'
import { DiffuserQueue } from '../../DiffuserQueue.js'
import { getEnv } from '../../../../../../getEnv.js'

export class GramJsTelegramMessenger extends MessengerProcessor implements Messenger {
	private apiId: number
	private apiHash: string
	private client: TelegramClient | undefined
	private session: StringSession | undefined
	private authsDir: string | undefined

	constructor(
		readonly logger: Logger,
		readonly avatarProvider: AvatarProvider,
		readonly difusserQueue: DiffuserQueue,
		messengerEnchancedServiceSettings: MessengerEnchancedServicesCapabilities
	) {
		super(logger, avatarProvider, difusserQueue, messengerEnchancedServiceSettings)
		this.apiId = Number(getEnv('TELEGRAM_APP_ID'))
		this.apiHash = getEnv('TELEGRAM_APP_HASH')
	}

	async connect(user: User): Promise<void> {
		const username = user.email.replace(/[^a-zA-Z0-9]/g, '')

		this.user = user
		this.authsDir = new URL(`../../../../../../../data/gramjssessions/${username}`, import.meta.url).pathname
		this.session = new StringSession(await this.getStoredSession())
		this.client = new TelegramClient(this.session, this.apiId, this.apiHash, {
			connectionRetries: 5
		})

		await this.client.start({
			phoneNumber: async () => user.phone,
			password: async () => await this.getUserPassword(),
			phoneCode: async () => await this.getOtpCode(),
			onError: err => {
				const errorMessage = err instanceof Error ? err.message : 'Unknown telegram client error'
				throw new Error(errorMessage)
			}
		})

		await this.saveSession(this.session.save())

		this.systemOn = true

		this.startQueues()

		this.client.addEventHandler(async ({ message: msg }) => {
			await this.onMessageReceived(msg)
		}, new NewMessage({}))

		serverEventEmitter.emit('telegram:ready', { user: this.user })

		this.logger.log(`[${this.botName()}] Connected`, 'info')
	}

	async disconnect(user: User): Promise<void> {
		await this.client?.destroy()
		this.client = undefined
		this.systemOn = false
		serverEventEmitter.emit('telegram:disconected', { user: this.user })
		this.logger.log(`[${this.botName()}] Disconnected`, 'info')
	}

	async logout(user: User): Promise<void> {
		try {
			await fs.stat(String(this.authsDir))
			await fs.rmdir(String(this.authsDir), { recursive: true })
		} catch (e) {
			this.logger.log(`[${this.botName()}] Logout skiped no auth file found`, 'warn')
		}
		await this.disconnect(user)
	}

	async isConnected(user: User): Promise<boolean> {
		return Boolean(this.client) && this.systemOn
	}

	async sendMessage(user: User, message: Message): Promise<void> {
		try {
			if (message.hasImages()) {
				const fileBuffer = message.content.images![0].data
				await this.client?.sendFile(message.chatId, { file: fileBuffer, caption: message.content.text })
			} else {
				await this.client?.sendMessage(message.chatId, { message: message.content.text })
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			this.logger.log(
				`[${this.botName()}] Error sending message to <<<${message.receiver.username}>>> <<<${errorMessage}>>>`
			)
		}
	}

	// ===================================
	// Message processor template methods
	// ===================================
	protected async parseMessageToMessage(rawMessage: Api.Message): Promise<Message | null> {
		const sender = (await rawMessage.getSender()) as Api.User
		const destiny = (await this.client?.getEntity(rawMessage.peerId)) as Api.User

		if (!sender || !destiny) {
			this.logger.log(`[${this.botName()}] Sender or destiny not found, skipping...`, 'debug')
			return null
		}

		// Sender and destiny must be private users (not bots or groups)
		const senderIsPrivate = sender?.className === 'User' && !sender?.bot
		const destinyIsPrivate = destiny?.className === 'User' && !destiny?.bot
		if (!senderIsPrivate || !destinyIsPrivate) {
			this.logger.log(`[${this.botName()}] Sender or destiny is not private, skipping...`, 'debug')
			return null
		}

		if (!sender.username && !sender.phone) {
			this.logger.log(`[${this.botName()}] Sender username or phone not found, skipping...`, 'debug')
			return null
		}

		if (!destiny.username && !destiny.phone) {
			this.logger.log(`[${this.botName()}] Destiny username or phone not found, skipping...`, 'debug')
			return null
		}

		const senderName =
			sender.firstName || sender.lastName
				? `${sender.firstName} ${sender.lastName || ''}`.trim()
				: sender.username || sender.phone || String(sender.id)
		const senderUsername = sender.username || sender.phone || String(sender.id)

		// Prevent sending messages to telegram bot
		const senderIsTelegramBot = senderName.toLowerCase() === 'telegram'
		if (senderIsTelegramBot) {
			this.logger.log(`[${this.botName()}] Telegram bot message detected, skipping...`, 'debug')
			return null
		}

		const destinyName =
			destiny.firstName || destiny.lastName
				? `${destiny.firstName} ${destiny.lastName || ''}`.trim()
				: destiny.username || destiny.phone || String(destiny.id)
		const destinyUsername = destiny.username || destiny.phone || String(destiny.id)

		const chatId = String(destiny.id)

		const body = rawMessage.text?.trim() || ''

		// Get audios
		const audios = []
		const isAudio = rawMessage?.document?.mimeType?.startsWith('audio/')

		if (isAudio) {
			const audio = await rawMessage.downloadMedia()
			const mime = rawMessage.document!.mimeType

			if (audio instanceof Buffer) {
				const audioAttachment: MessageAttachment<MessageAttachmentAudio> = {
					type: 'audio',
					data: audio,
					meta: { mime }
				}
				audios.push(audioAttachment)
			}
		}

		// Get images
		const images = []
		const isImage = Boolean(rawMessage?.photo)
		if (isImage) {
			const image = await rawMessage.downloadMedia()
			if (image && image instanceof Buffer) {
				const mime = this.getMimeFromBuffer(image!)

				if (mime) {
					const imageAttachment: MessageAttachment<MessageAttachmentImage> = {
						type: 'image',
						data: image,
						meta: { mime }
					}
					images.push(imageAttachment)
				} else {
					this.logger.log(`[${this.botName()}] Image mime not found, skipping...`, 'warn')
					return null
				}
			} else {
				this.logger.log(`[${this.botName()}] Image detected but not found, skipping...`, 'warn')
				return null
			}
		}

		const message = new Message({
			id: v4(),
			chatId,
			channel: BOT_NAME.TELEGRAM,
			sender: {
				id: sender.phone || String(sender.id),
				name: senderName,
				username: senderUsername,
				isMe: sender.phone === this.user?.phone
			},
			receiver: {
				id: destiny.phone || String(destiny.id),
				name: destinyName,
				username: destinyUsername,
				isMe: destiny.phone === this.user?.phone
			},
			timestamp: Number(rawMessage.date) * 1000,
			content: {
				text: body,
				audios,
				images
			},
			status: MESSAGE_STATUS.PENDING,
			isBotMessage: await this.messageIsAutoResponse(chatId, body),
			meta: {
				ephimeral: rawMessage.ttlPeriod
			}
		})

		return message
	}

	protected async setChatState(message: Message, state: CHAT_STATE): Promise<void> {
		this.logger.log(`[${this.botName()}] setting chat state <<<${state}>>>`, 'debug')
	}

	protected botName(): BOT_NAME {
		return BOT_NAME.TELEGRAM
	}

	// ===================================
	// Specific Gramjs methods
	// ===================================
	// ====================
	// Login management
	// ====================
	private async getUserPassword(): Promise<string> {
		this.logger.log(`[${this.botName()}] Requesting password`, 'info')

		return new Promise((resolve, reject) => {
			serverEventEmitter.emit('telegram:password:request', { user: this.user })

			serverEventEmitter.once('telegram:password:set', ({ password, user }) => {
				if (user.id !== this.user?.id) return
				resolve(password)
			})

			setTimeout(() => {
				reject(new Error('Timeout waiting for password response'))
			}, 60000)
		})
	}

	private async getOtpCode(): Promise<string> {
		this.logger.log(`[${this.botName()}] Requesting OTP code`, 'info')

		return new Promise((resolve, reject) => {
			serverEventEmitter.emit('telegram:otp:request', { user: this.user })

			serverEventEmitter.once('telegram:otp:set', ({ otp, user }) => {
				if (user.id !== this.user?.id) return
				resolve(otp)
			})

			setTimeout(() => {
				reject(new Error('Timeout waiting for phone code response'))
			}, 60000)
		})
	}

	// ====================
	// Session management
	// ====================
	private async saveSession(session: string) {
		if (!this.authsDir) throw new Error('No auths dir found')

		await fs.mkdir(this.authsDir, { recursive: true })
		await fs.writeFile(`${this.authsDir}/session`, session)

		this.logger.log(`[${this.botName()}] Session saved <<<${this.authsDir}/session>>>`, 'debug')
	}

	private async getStoredSession() {
		if (!this.authsDir) {
			throw new Error('No auths dir found')
		}

		try {
			await fs.stat(`${this.authsDir}/session`)
			const session = await fs.readFile(`${this.authsDir}/session`, 'utf-8')
			this.logger.log(`[${this.botName()}] Session found <<<${session}>>>`, 'debug')
			return session
		} catch (e) {
			this.logger.log(`[${this.botName()}] Session not found ${this.authsDir}`, 'debug')
			return ''
		}
	}

	private getMimeFromBuffer(buffer: Buffer): string | null {
		const hex = buffer.toString('hex', 0, 4)

		switch (hex) {
			case 'ffd8ffe0':
			case 'ffd8ffe1':
			case 'ffd8ffe2':
			case 'ffd8ffe3':
			case 'ffd8ffe8':
				return 'image/jpeg'
			case '89504e47':
				return 'image/png'
			case '47494638':
				return 'image/gif'
			case '52494646': // RIFF files, could be multiple types like WEBP or WAV
				// Verify WEBP signature
				if (buffer.toString('hex', 8, 12) === '57454250') return 'image/webp'
				return null
			default:
				return null
		}
	}
}
