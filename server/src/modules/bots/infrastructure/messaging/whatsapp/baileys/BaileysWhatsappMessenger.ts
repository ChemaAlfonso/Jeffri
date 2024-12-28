import {
	makeWASocket,
	UserFacingSocketConfig,
	DisconnectReason,
	WASocket,
	useMultiFileAuthState,
	isJidBroadcast,
	fetchLatestBaileysVersion,
	AuthenticationState,
	WAMessage,
	WA_DEFAULT_EPHEMERAL,
	BaileysEventMap,
	downloadMediaMessage,
	WAPresence,
	isJidGroup,
	isJidStatusBroadcast,
	isJidNewsletter
} from '@whiskeysockets/baileys'
import { v4 } from 'uuid'
import fs from 'fs/promises'
import { Boom } from '@hapi/boom'
import { User } from '../../../../../users/domain/User.js'
import {
	Message,
	MESSAGE_STATUS,
	MessageAttachment,
	MessageAttachmentAudio,
	MessageAttachmentImage
} from '../../../../../bots/domain/Message.js'
import { Messenger, MessengerEnchancedServicesCapabilities } from '../../../../../bots/domain/Messenger.js'
import { serverEventEmitter } from '../../../../../../app/serverEvents.js'
import { Logger } from '../../../../../shared/domain/Logger.js'
import { CHAT_STATE, MessengerProcessor } from '../../MessengerProcessor.js'
import { AvatarProvider } from '../../../../../shared/domain/AvatarProvider.js'
import { BOT_NAME } from '../../../../../bots/domain/Bot.js'
import { message } from 'telegram/client/index.js'
import { DiffuserQueue } from '../../DiffuserQueue.js'

export class BaileysWhatsappMessenger extends MessengerProcessor implements Messenger {
	private sock: WASocket | undefined
	private sockIsShuttingDown = false
	private authsDir: string | undefined
	private auth?: {
		state: AuthenticationState
		saveCreds: () => Promise<void>
	}

	// Spam prevention
	private minTimeToGenerateResponse = 1000 * 20
	private maxTimeToGenerateResponse = 1000 * 30

	constructor(
		readonly logger: Logger,
		readonly avatarProvider: AvatarProvider,
		readonly difusserQueue: DiffuserQueue,
		messengerEnchancedServiceSettings: MessengerEnchancedServicesCapabilities
	) {
		super(logger, avatarProvider, difusserQueue, messengerEnchancedServiceSettings)
	}

	async connect(user: User) {
		const username = user.email.replace(/[^a-zA-Z0-9]/g, '')
		this.user = user
		this.authsDir = new URL(`../../../../../../../data/wasessions/${username}`, import.meta.url).pathname

		// fetch latest version of WA Web
		const { /*version,*/ isLatest } = await fetchLatestBaileysVersion()
		const version: [number, number, number] = [2, 3000, 1015901307] // hardcoded version for now
		this.logger.log(`[Whatsapp] Using WA v${version.join('.')}, isLatest: ${isLatest}`, 'info')

		const config: Partial<UserFacingSocketConfig> = {
			printQRInTerminal: true,
			generateHighQualityLinkPreview: true,
			shouldIgnoreJid: jid =>
				isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid) || isJidGroup(jid),
			emitOwnEvents: false,
			markOnlineOnConnect: false
		}

		this.auth = await useMultiFileAuthState(this.authsDir)

		if (this.sock) {
			const eventsToRemove: (keyof BaileysEventMap)[] = ['connection.update', 'messages.upsert', 'creds.update']

			for (const event of eventsToRemove) {
				this.sock.ev.removeAllListeners(event)
			}
		}

		this.sock = makeWASocket({ ...config, auth: this.auth.state, version })

		this.sock.ev.on('connection.update', async update => {
			const { connection, lastDisconnect, qr } = update

			if (qr) {
				serverEventEmitter.emit('whatsapp:qr', { qr, user: this.user })
			} else if (connection === 'close') {
				serverEventEmitter.emit('whatsapp:closedconnection', { user: this.user })

				this.systemOn = false

				const shouldReconnect =
					(lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut

				if (this.sockIsShuttingDown || !shouldReconnect) {
					this.sock = undefined
					this.logger.log('[Whatsapp] Connection closed', 'warn')
					return
				}

				// reconnect if not logged out
				setTimeout(async () => {
					this.logger.log(
						`[Whatsapp] Connection reconecting... <<<${JSON.stringify(lastDisconnect)}>>>`,
						'warn'
					)
					await this.connect(this.user!)
				}, 1000)
			} else if (connection === 'open') {
				serverEventEmitter.emit('whatsapp:ready', { user: this.user })

				if (this.systemOn) {
					this.logger.log(
						'[Whatsapp] Conection opened with system already on, skipping reinvoke queue processor',
						'warn'
					)
					return
				}

				this.systemOn = true

				this.startQueues()

				this.logger.log('[Whatsapp] Connection opened', 'info')
			}
		})

		this.sock.ev.on('messages.upsert', async msg => {
			this.auth?.saveCreds()

			const { messages } = msg

			for (const message of messages) {
				await this.onMessageReceived(message)
				this.auth?.saveCreds()
			}
		})

		this.sock.ev.on('creds.update', () => {
			this.auth?.saveCreds()
		})
	}

	async disconnect(user: User) {
		this.sockIsShuttingDown = true
		this.sock?.end(undefined)
		this.sock = undefined
		this.systemOn = false
		this.logger.log(`[${this.botName()}] Disconnected`, 'info')
	}

	async logout(user: User) {
		try {
			await fs.stat(String(this.authsDir))
			await fs.rmdir(String(this.authsDir), { recursive: true })
		} catch (e) {
			this.logger.log(`[Whatsapp] Logout skiped no auth file found <<<${this.authsDir}>>>`, 'warn')
		}

		await this.disconnect(user)
	}

	async isConnected(user: User): Promise<boolean> {
		try {
			await fs.stat(String(this.authsDir))
		} catch (error) {
			return false
		}
		return Boolean(this.sock) && this.systemOn
	}

	async sendMessage(user: User, message: Message) {
		const options: { ephemeralExpiration?: number } = {
			ephemeralExpiration: message.meta?.ephimeral ?? WA_DEFAULT_EPHEMERAL
		}

		this.logger.log(`[${this.botName()}] Sending message to <<<${message.chatId}>>>`, 'debug')

		if (message.hasImages()) {
			const fileBuffer = message.content.images![0].data
			const fileName = (fileBuffer as any).name
			await this.sock?.sendMessage(
				message.chatId,
				{ caption: message.content.text, image: fileBuffer, fileName },
				options
			)
		} else {
			await this.sock?.sendMessage(message.chatId, { text: message.content.text }, options)
		}
	}

	protected async parseMessageToMessage(rawMessage: WAMessage): Promise<Message | null> {
		const chatId = rawMessage.key.remoteJid!

		const isGroup = chatId.includes('-')

		if (isGroup) {
			this.logger.log(`[${this.botName()}] Group chat message, skipping...`, 'debug')
			return null
		}

		const currentUserPhoneId = this.generateIdFromPhone(this.user!.phone)

		// message.key.remoteJid! is the id of the other participant in the chat
		// if fromMe is true, the message was sent by the user else it was received
		const fromId = rawMessage.key.fromMe ? currentUserPhoneId : rawMessage.key.remoteJid!
		const fromPhone = this.getPhoneFromId(fromId)
		const toId = rawMessage.key.fromMe ? rawMessage.key.remoteJid! : currentUserPhoneId
		const toPhone = this.getPhoneFromId(toId)
		const body = rawMessage.message?.extendedTextMessage?.text || rawMessage.message?.imageMessage?.caption || ''

		// Get audios
		const audios = []
		const isAudio = rawMessage.message?.audioMessage?.mimetype?.startsWith('audio/')

		if (isAudio) {
			const audio = await downloadMediaMessage(rawMessage, 'buffer', {})
			const mime = rawMessage.message?.audioMessage?.mimetype!

			if (audio instanceof Buffer) {
				const audioAttachment: MessageAttachment<MessageAttachmentAudio> = {
					type: 'audio',
					data: audio,
					meta: { mime: mime.slice(0, mime.lastIndexOf(';')) }
				}
				audios.push(audioAttachment)
			}
		}

		// Get images
		const images = []
		const isImage = rawMessage.message?.imageMessage?.mimetype?.startsWith('image/')
		if (isImage) {
			const image = await downloadMediaMessage(rawMessage, 'buffer', {})
			const mime = rawMessage.message?.imageMessage?.mimetype!

			if (image instanceof Buffer) {
				const imageAttachment: MessageAttachment<MessageAttachmentImage> = {
					type: 'image',
					data: image,
					meta: { mime: mime.slice(0, mime.lastIndexOf(';')) }
				}
				images.push(imageAttachment)
			}
		}

		const message = new Message({
			id: v4(),
			chatId,
			channel: BOT_NAME.WHATSAPP,
			sender: {
				id: fromPhone,
				name: rawMessage.pushName || rawMessage.verifiedBizName || fromPhone,
				username: fromPhone,
				isMe: fromPhone === this.user?.phone
			},
			receiver: {
				id: toPhone,
				name: toPhone,
				username: toPhone,
				isMe: toPhone === this.user?.phone
			},
			timestamp: Number(rawMessage.messageTimestamp) * 1000,
			content: {
				text: body,
				audios,
				images
			},
			status: MESSAGE_STATUS.PENDING,
			isBotMessage: await this.messageIsAutoResponse(chatId, body),
			meta: {
				ephimeral: rawMessage.message?.extendedTextMessage?.contextInfo?.expiration ?? WA_DEFAULT_EPHEMERAL
			}
		})

		return message
	}

	protected async setChatState(message: Message, state: CHAT_STATE): Promise<void> {
		this.logger.log(`[${this.botName()}] setting chat state <<<${state}>>>`, 'debug')
		const chatStateToWaStateMap: Record<CHAT_STATE, WAPresence> = {
			[CHAT_STATE.ONLINE]: 'available',
			[CHAT_STATE.TYPING]: 'composing',
			[CHAT_STATE.OFFLINE]: 'unavailable',
			[CHAT_STATE.DEFAULT]: 'paused'
		}

		// Simulate a human setting a bit of delay
		if (state === CHAT_STATE.ONLINE || state === CHAT_STATE.TYPING)
			await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 3000))

		await this.sock?.sendPresenceUpdate(chatStateToWaStateMap[state])
	}

	protected botName(): BOT_NAME {
		return BOT_NAME.WHATSAPP
	}

	protected async beforeGenerateResponse(message: Message) {
		await this.spamPreverterDelay()
	}

	// ===================================
	// Specific Baileys methods
	// ===================================
	private async spamPreverterDelay() {
		const delay =
			Math.floor(Math.random() * (this.maxTimeToGenerateResponse - this.minTimeToGenerateResponse)) +
			this.minTimeToGenerateResponse

		this.logger.log(`[Whatsapp] Delaying response for <<<${delay}>>> ms`, 'info')

		return new Promise(resolve => setTimeout(resolve, delay))
	}

	private generateIdFromPhone(phone: string) {
		return phone + '@s.whatsapp.net'
	}

	private getPhoneFromId(id: string) {
		return id.split('@')[0]
	}
}
