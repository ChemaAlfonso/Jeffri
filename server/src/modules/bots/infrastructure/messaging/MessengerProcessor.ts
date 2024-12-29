import { v4 } from 'uuid'
import { asyncContainer } from '../../../../app/di/container.js'
import { CreateContact } from '../../../contacts/application/CreateContact.js'
import { SearchByBotHandler } from '../../../contacts/application/SearchByBotHandler.js'
import { ContactPrimitives } from '../../../contacts/domain/Contact.js'
import { User } from '../../../users/domain/User.js'
import { HISTORY_MESSAGE_ROLE, LLM_MODEL, LlmProvider } from '../../domain/LlmProvider.js'
import { Message, MESSAGE_STATUS } from '../../../bots/domain/Message.js'
import { Messenger, MessengerEnchancedServicesCapabilities } from '../../../bots/domain/Messenger.js'
import { Logger } from '../../../shared/domain/Logger.js'
import { SearchModelConfigByOwner } from '../../../modelConfigs/application/SearchModelConfigByOwner.js'
import { SearchAiContextByBotName } from '../../../aiContexts/application/SearchAiContextByBotName.js'
import { AvatarProvider } from '../../../shared/domain/AvatarProvider.js'
import { SearchBotByName } from '../../../bots/application/SearchBotByName.js'
import { BOT_NAME } from '../../../bots/domain/Bot.js'
import { ModelConfigConfig } from '../../../modelConfigs/domain/ModelConfig.js'
import { MessageAttachmentTranscriber } from '../../../bots/domain/MessageAttachmentTranscriber.js'
import { MessageImageGenerator } from '../../../bots/domain/MessageImageGenerator.js'
import { DiffuserQueue } from './DiffuserQueue.js'
import { Mutex } from 'async-mutex'
import { MessageAttachmentVisor } from '../../../bots/domain/MessageAttachmentVisor.js'
import { HistoryBuffer } from './HistoryBuffer.js'
import { BotCommand } from '../../domain/BotCommand.js'
import { BotOwnerHasNoModelConfigExistsDomainError } from '../../domain/BotOwnerHasNoModelConfigExistsDomainError.js'

export enum CHAT_STATE {
	ONLINE = 'online',
	TYPING = 'typing',
	OFFLINE = 'offline',
	DEFAULT = 'default'
}

export abstract class MessengerProcessor implements Messenger {
	protected systemOn = false

	// User
	protected user?: User

	// Queue
	private processingQueueByChatId = new Map<string, Message[]>()
	private processingQueueTimeout = 1000
	private processingQueueRunning = false
	private processingQueueMutex = new Mutex()
	private diffusionQueueRunning = false
	private diffusionQueueMutex = new Mutex()

	// Auto responses
	private stopedAutoResponsesByChatId = new Map<string, NodeJS.Timeout>()
	private autoResponseDisabledTimeout = 1000 * 60 * 30 // 30 minutes

	// History
	private messageHistory = new Map<string, HistoryBuffer>()
	private maxHistoryTokens = 8192

	// Message
	private handleMessagesSinceNowMinus = 1000 * 60 * 5
	private procesingAbortControllers = new Map<string, AbortController>()

	constructor(
		protected readonly logger: Logger,
		protected readonly avatarProvider: AvatarProvider,
		protected readonly difusserQueue: DiffuserQueue,
		private readonly messengerEnchancedServicesCapabilities: MessengerEnchancedServicesCapabilities
	) {}

	abstract connect(user: User): Promise<void>
	abstract disconnect(user: User): Promise<void>
	abstract logout(user: User): Promise<void>
	abstract isConnected(user: User): Promise<boolean>
	abstract sendMessage(user: User, message: Message): Promise<void>
	protected abstract parseMessageToMessage(message: unknown): Promise<Message | null>
	protected abstract setChatState(message: Message, state: CHAT_STATE): Promise<void>
	protected abstract botName(): BOT_NAME
	protected beforeGenerateResponse(message: Message): Promise<void> {
		return Promise.resolve()
	}
	protected afterGenerateResponse(message: Message): Promise<void> {
		return Promise.resolve()
	}

	// =========================================================
	// A1. General implementation message reception
	// =========================================================
	protected async onMessageReceived(rawMessage: unknown): Promise<void> {
		try {
			this.logger.log(`[${this.botName()}] New message received`, 'info')

			const message = await this.parseMessageToMessage(rawMessage)

			if (!message) return

			if (message.sender.isMe && !message.receiver.isMe && !message.isBotMessage) this.stopAutoResponses(message)

			if (!(await this.shouldProcessMessage(message))) return

			if (await this.isCommand(message)) await this.hadleCommand(message)
			else await this.addMessageToProcessingQueue(message)
		} catch (error) {
			this.logger.log(`[${this.botName()}] Error handling new message <<<${error}>>>`, 'error')
		}
	}

	private async stopAutoResponses(message: Message): Promise<void> {
		if (this.stopedAutoResponsesByChatId.has(message.chatId))
			clearTimeout(this.stopedAutoResponsesByChatId.get(message.chatId))

		this.stopedAutoResponsesByChatId.set(
			message.chatId,
			setTimeout(() => {
				this.stopedAutoResponsesByChatId.delete(message.chatId)
			}, this.autoResponseDisabledTimeout)
		)

		this.logger.log(`[${this.botName()}] Auto responses stopped for <<<${message.chatId}>>>`, 'info')
	}

	private async shouldProcessMessage(message: Message): Promise<boolean> {
		if (message.isBotMessage) {
			this.logger.log(`[${this.botName()}] Message is from bot, skipping...`, 'info')
			return false
		}

		const olderTimeToConsider = Date.now() - this.handleMessagesSinceNowMinus

		if (message.timestamp < olderTimeToConsider) {
			this.logger.log(`[${this.botName()}] Message is too old, skipping...`, 'info')
			return false
		}

		return true
	}

	private async addMessageToProcessingQueue(message: Message): Promise<void> {
		const messages = this.processingQueueByChatId.get(message.chatId) || []
		messages.push(message)

		this.processingQueueByChatId.set(message.chatId, messages)
		this.logger.log(`[${this.botName()}] Message added to queue for <<<${message.chatId}>>>`, 'debug')

		this.abortCurrentProcessing(message.chatId)
	}

	// =========================================================
	// A2. General implementation queue processing
	// =========================================================
	protected startQueues(): void {
		this.processQueue()
		this.processDiffusionQueue()
	}

	private async processQueue(): Promise<void> {
		if (!this.systemOn) {
			this.logger.log(`[${this.botName()}] System is off, processing queue stopped`, 'info')
			return
		}

		if (this.processingQueueRunning) {
			this.logger.log(`[${this.botName()}] Processing queue already running, skipping new run...`, 'warn')
			return
		}

		const releaseProcesingQueueMutext = await this.processingQueueMutex.acquire()

		this.processingQueueRunning = true

		try {
			for (const [chatId, messages] of this.processingQueueByChatId) {
				if (messages.length === 0) continue

				// Generate a batch of messages to process with the same sender
				// until the next message is from the other sender
				const nextMessageInQueueIsMine = messages[0].sender.isMe
				const messageBatch: Message[] = []
				for (const msg of messages) {
					if (nextMessageInQueueIsMine && msg.sender.isMe) {
						messageBatch.push(msg)
					} else if (!nextMessageInQueueIsMine && !msg.sender.isMe) {
						messageBatch.push(msg)
					} else {
						break
					}
				}
				const message = messageBatch.reduce((acc, message) => acc.combineWith(message))

				this.logger.log(`[${this.botName()}] Processing message from <<<${message.sender.id}>>>`, 'debug')

				if (!(await this.accessListsAllowsProcessMessage(message))) {
					this.logger.log(
						`[${this.botName()}] Message from <<<${message.sender.id}>>> is not whitelisted, skipping...`,
						'info'
					)
					// Clear the queue for this chatId if the chat of message is not whitelisted
					this.removeMessagesFromQueue(chatId, messages)
					continue
				}

				if (!(await this.messageSenderExistsAsContact(message))) await this.createContactFromSender(message)

				this.createProcessingAborter(chatId)

				try {
					if (message.sender.isMe && !message.receiver.isMe) {
						await this.processOutgoingMessage(message)
						this.logger.log(
							`[${this.botName()}] Outgoing message for <<<${message.sender.id}>>> processed`,
							'info'
						)
					} else {
						await this.processIncomingMessage(message)
						this.logger.log(
							`[${this.botName()}] Incoming message from <<<${message.sender.id}>>> processed`,
							'info'
						)
					}

					// Remove processed messages from queue
					this.removeMessagesFromQueue(chatId, messageBatch)
				} catch (error) {
					const errorIsError = error instanceof Error

					if (errorIsError && (error.name === 'AbortError' || error.message === 'AbortError')) {
						this.logger.log(`[${this.botName()}] Request aborted`, 'warn')
					} else {
						const errorMessage = error instanceof Error ? error.message : 'Unknown error processing message'
						this.logger.log(
							`[${this.botName()}] Error processing message on queue <<<${errorMessage}>>>`,
							'error'
						)

						// Clear the queue for this chatId if and unknown error occurs
						this.removeMessagesFromQueue(chatId, messages)
					}
				}

				// Clear the abort controller for this chatId
				this.removeProcesingAborter(chatId)
			}
		} finally {
			await new Promise(resolve => setTimeout(resolve, this.processingQueueTimeout))
			releaseProcesingQueueMutext()
			this.processingQueueRunning = false
			await this.processQueue()
		}
	}

	private async messageSenderExistsAsContact(message: Message): Promise<boolean> {
		const container = await asyncContainer()

		const contact = await container
			.get<SearchByBotHandler>('Contacts.SearchByBotHandler')
			.run(String(this.user!.id), message.channel, message.sender.id)

		return Boolean(contact)
	}

	private async createContactFromSender(message: Message): Promise<void> {
		const container = await asyncContainer()
		const contactCreator = container.get<CreateContact>('Contacts.CreateContact')

		const contactPrimitives: ContactPrimitives = {
			id: v4(),
			ownerId: String(this.user?.id),
			name: message.sender.name,
			avatar: await this.avatarProvider.generate(message.sender.username),
			botHandlers: {
				[message.channel]: message.sender.id
			},
			contexts: [],
			createdAt: Date.now()
		}

		await contactCreator.run(contactPrimitives)

		this.logger.log(`[${this.botName()}] New contact created <<<${contactPrimitives.id}>>>`, 'info')
	}

	private async accessListsAllowsProcessMessage(message: Message): Promise<boolean> {
		const container = await asyncContainer()
		const bot = await container.get<SearchBotByName>('Bots.SearchBotByName').run(this.user!.id, this.botName())

		const whitelist: string[] = bot?.whitelist || []
		const hasWhiteList = whitelist.length > 0
		const whitelistAllowsContact = !hasWhiteList || whitelist.includes(message.sender.id)

		const blacklist: string[] = bot?.blacklist || []
		const hasBlackList = blacklist.length > 0
		const blacklistAllowsContact = !hasBlackList || !blacklist.includes(message.sender.id)

		return whitelistAllowsContact && blacklistAllowsContact
	}

	private async processOutgoingMessage(message: Message): Promise<void> {
		await this.addMessageToHistory(message, HISTORY_MESSAGE_ROLE.ASSISTANT)
	}

	private async processIncomingMessage(message: Message): Promise<void> {
		// Include attachments content as the message text to be processed
		await this.enrichMessageTextContentWithAttatchmentsContent(message)

		// Empty requests should not be handled
		if (!message.content.text) {
			this.logger.log(`[${this.botName()}] Empty message, skipping...`, 'info')
			return
		}

		if (await this.autoResponsesAreDisabled(message)) {
			this.logger.log(
				`[${this.botName()}] Auto responses are disabled for <<<${message.chatId}>>>, skipping...`,
				'info'
			)
			await this.addMessageToHistory(message, HISTORY_MESSAGE_ROLE.USER)
			return
		}

		await this.setChatState(message, CHAT_STATE.ONLINE)
		await this.setChatState(message, CHAT_STATE.TYPING)

		const messageResponse = await this.generateResponse(message)

		await this.addMessageToHistory(message, HISTORY_MESSAGE_ROLE.USER)

		// Empty responses should not be sent
		if (!messageResponse.content.text) {
			await this.setChatState(message, CHAT_STATE.OFFLINE)
			return
		}

		await this.addMessageToHistory(messageResponse, HISTORY_MESSAGE_ROLE.ASSISTANT)

		await this.sendMessage(this.user!, messageResponse)

		await this.setChatState(message, CHAT_STATE.OFFLINE)
	}

	private async autoResponsesAreDisabled(message: Message): Promise<boolean> {
		return Boolean(this.stopedAutoResponsesByChatId.get(message.chatId))
	}

	private getChatHistoryBuffer(chatId: string): HistoryBuffer {
		let chatHistoryBuffer = this.messageHistory.get(chatId)

		if (!chatHistoryBuffer) {
			chatHistoryBuffer = new HistoryBuffer(this.maxHistoryTokens)
			this.messageHistory.set(chatId, chatHistoryBuffer)
		}

		return chatHistoryBuffer
	}

	private async addMessageToHistory(message: Message, role: HISTORY_MESSAGE_ROLE): Promise<void> {
		const chatHistoryBuffer = this.getChatHistoryBuffer(message.chatId)

		chatHistoryBuffer.addMessage({ role, content: message.content.text })

		this.messageHistory.set(message.chatId, chatHistoryBuffer)
	}

	private async clearChatHistory(chatId: string): Promise<void> {
		const chatHistoryBuffer = this.getChatHistoryBuffer(chatId)
		chatHistoryBuffer.clearHistory()
	}

	private removeMessagesFromQueue(chatId: string, messages: Message[]): void {
		const messagesInQueue = this.processingQueueByChatId.get(chatId) || []
		this.processingQueueByChatId.set(
			chatId,
			messagesInQueue.filter(msg => !messages.includes(msg))
		)
		this.logger.log(`[${this.botName()}] Messages removed from queue for <<<${chatId}>>>`, 'debug')
	}

	private createProcessingAborter(chatId: Message['chatId']): AbortController {
		const abortController = new AbortController()
		this.procesingAbortControllers.set(chatId, abortController)
		this.logger.log(`[${this.botName()}] Abort controller created for <<<${chatId}>>>`, 'debug')

		return abortController
	}

	private abortCurrentProcessing(chatId: Message['chatId']): void {
		const abortController = this.procesingAbortControllers.get(chatId)
		if (abortController && !abortController.signal.aborted) {
			this.logger.log(`[${this.botName()}] Sending abort signal for <<<${chatId}>>>`, 'debug')
			abortController.abort()
		}
	}

	private removeProcesingAborter(chatId: Message['chatId']): void {
		const abortController = this.procesingAbortControllers.get(chatId)

		if (abortController) {
			this.procesingAbortControllers.delete(chatId)
			this.logger.log(`[${this.botName()}] Abort controller removed for <<<${chatId}>>>`, 'debug')
		}
	}

	// ===================================
	// AI response generation
	// ===================================
	// Messages can have attachments like audio files, images, etc.
	// The bot only can process text messages, so we need to extract relevant information from attachments
	// and enrich the message text content including attachments as text to be processed by the AI model
	private async enrichMessageTextContentWithAttatchmentsContent(message: Message): Promise<void> {
		// Transcribe audio message attachments
		await this.addTranscribedAudiosToMessage(message)

		// Describe image message attachments
		await this.addDescriptedImagesToMessage(message)
	}

	private async addTranscribedAudiosToMessage(message: Message): Promise<void> {
		// Transcribe message attachments
		if (!message.content.audios?.length) return

		if (!this.messengerEnchancedServicesCapabilities.enableTranscriptions) return

		const container = await asyncContainer()
		const transcriber = container.get<MessageAttachmentTranscriber>('Chats.MessageAttachmentTranscriber')

		try {
			const transcribedText = (
				await Promise.all(message.content.audios.map(audio => transcriber.transcribe(audio)))
			).join('\n\n')

			if (transcribedText.length) message.content.text = `${message.content.text}\n\n${transcribedText}`

			this.logger.log(
				`[${this.botName()}] Transcribed attachments for <<<${message.chatId}>>>: <<<${transcribedText}>>>`,
				'debug'
			)
		} catch (error) {
			const errorMesage = error instanceof Error ? error.message : 'Unknown error transcribing attachments'
			this.logger.log(
				`[${this.botName()}] Error transcribing attachments for <<<${message.chatId}>>> <<<${errorMesage}>>>`,
				'error'
			)
		}
	}

	private async addDescriptedImagesToMessage(message: Message): Promise<void> {
		// Describe message image attachments
		if (!message.content.images?.length) return

		if (!this.messengerEnchancedServicesCapabilities.enableImagesVisor) return

		const container = await asyncContainer()
		const descriptor = container.get<MessageAttachmentVisor>('Chats.MessageAttachmentVisor')

		try {
			const describedTexts = (
				await Promise.all(message.content.images.map(image => descriptor.describe(image)))
			).filter(text => text.length)

			if (describedTexts.length === 0) {
				this.logger.log(`[${this.botName()}] No image descriptions found for <<<${message.chatId}>>>`, 'warn')
				return
			}

			// Single image description
			if (describedTexts.length === 1) {
				message.content.text =
					`${message.content.text}\n\n` +
					`Here is an image caption: ` +
					`"${describedTexts[0]}"\n` +
					`Imagine you are seeing the image based on its caption if the conversation requires it.\n` +
					`**DO NOT mention i provided you the image description**;.\n` +
					`**DO NOT add any details that are not present in the description**.\n` +
					`**Respond in the language of the conversation despite this concrete text and the image description are in English**.\n\n`
			} else {
				// Multiple image descriptions
				let imageDescriptions = 'Here are some image captions:'
				describedTexts.forEach((text, index) => {
					imageDescriptions = `Caption ${index + 1}: "${text}"\n---\n`
				})
				imageDescriptions +=
					`Imagine you are seeing the images based on their captions if the conversation requires it.\n` +
					`**DO NOT mention i provided you the image descriptions**;.\n` +
					`**DO NOT add any details that are not present in the descriptions**.\n` +
					`**Respond in the language of the conversation despite this concrete text and the image descriptions are in English**.\n\n`

				message.content.text = `${message.content.text}\n\n${imageDescriptions}`
			}

			this.logger.log(
				`[${this.botName()}] Described image attachments for <<<${message.chatId}>>>: <<<${describedTexts.join(
					'\n\n'
				)}>>>`,
				'debug'
			)
		} catch (error) {
			const errorMesage = error instanceof Error ? error.message : 'Unknown error describing attachments'
			this.logger.log(
				`[${this.botName()}] Error describing attachments for <<<${message.chatId}>>> <<<${errorMesage}>>>`,
				'error'
			)
		}
	}

	private async generateResponse(message: Message): Promise<Message> {
		const container = await asyncContainer()
		const llmProvider = container.get<LlmProvider>('Chats.LlmProvider')
		const customContext = await this.getCustomContexts(message)
		const commandExplanationContext =
			'The user can execute commands as messages in this chat. All messages starting with / are user commands but ' +
			'you cannot execute or process commands as assistant so, if the user explicitly asks for a command, tell he needs directly execute it using the command directly. ' +
			'The command invocation and their results are automatically handled by the system and appended to the chat history for you but only to have a better context about the conversation.' +
			"You SHOULD ONLY inform of commands if the user asks for them explicitly. If he doesn't ask for commands, never inform about them. " +
			'If the user asks for them, the ONLY available commands are: ' +
			JSON.stringify(this.getCommands())

		const { model, modelParams } = await this.getAiModel()

		const customContextShortedNames = customContext
			.map(context => context.slice(0, Math.min(20, context.length)) + '...')
			.join(', ')

		this.logger.log(
			`[${this.botName()}] Contexts for <<<${message.chatId}>>>: <<<${customContextShortedNames}>>>`,
			'debug'
		)

		const signal = this.procesingAbortControllers.get(message.chatId)!.signal

		await this.beforeGenerateResponse(message)

		const historyWithNewMessage = [
			...this.getChatHistoryBuffer(message.chatId).getHistory(),
			{ role: HISTORY_MESSAGE_ROLE.USER, content: message.content.text }
		]

		const response = await llmProvider.chat({
			messageHistory: historyWithNewMessage,
			customContext: [commandExplanationContext, ...customContext],
			signal,
			model,
			modelParams
		})

		await this.afterGenerateResponse(message)

		const generatedMessage = new Message({
			id: v4(),
			chatId: message.chatId,
			sender: {
				id: message.receiver.id,
				name: 'LlmProvider',
				username: 'llmProvider',
				isMe: true
			},
			receiver: { ...message.sender },
			timestamp: Date.now(),
			content: {
				text: response
			},
			channel: message.channel,
			isBotMessage: true,
			status: MESSAGE_STATUS.PENDING,
			meta: {
				ephimeral: message.meta.ephimeral
			}
		})

		return generatedMessage
	}

	private async getCustomContexts(message: Message): Promise<string[]> {
		// Obtain all contexts for this sender and provider
		const container = await asyncContainer()
		const contextsStored = await container
			.get<SearchAiContextByBotName>('AiContexts.SearchAiContextByBotName')
			.run(this.user!.id, this.botName())

		const enabledContexts = contextsStored.filter(context => context.enabled)

		// If current sender has assigned contexts, return only those
		const contact = await container
			.get<SearchByBotHandler>('Contacts.SearchByBotHandler')
			.run(String(this.user!.id), message.channel, message.sender.id)

		const contextsForCurrentTalker = enabledContexts.filter(context => contact?.contexts.includes(context.id))

		if (contextsForCurrentTalker?.length)
			return contextsForCurrentTalker.map(context => this.replaceVars(context.content))

		// If current sender doesn't have exclusive contexts, return all non exclusives enabled
		return enabledContexts.filter(context => !context.exclusive).map(context => this.replaceVars(context.content))
	}

	private async getAiModel(): Promise<{ model: LLM_MODEL; modelParams: ModelConfigConfig }> {
		const container = await asyncContainer()

		const modelConfigSearcher = await container
			.get<SearchModelConfigByOwner>('ModelConfigs.SearchModelConfigByOwner')
			.run(this.user!.id)

		if (!modelConfigSearcher) throw new BotOwnerHasNoModelConfigExistsDomainError(this.user!.id)

		return {
			model: modelConfigSearcher.model as LLM_MODEL,
			modelParams: modelConfigSearcher.config
		}
	}

	private replaceVars(text: string) {
		const datetime = new Date()
		const [date, time] = new Date().toISOString().split('T')

		text = text.replace('[datetime]', datetime.toISOString()).replace('[date]', date).replace('[time]', time)

		return text
	}

	// ===================================
	// Command handling
	// ===================================
	private getCommands() {
		const commands: BotCommand[] = [
			{
				command: '/reset',
				description:
					'Borra la memoria del asistente y empieza de nuevo. El asistente no recordará nada de la conversación actual tras ejecutar este comando.',
				usage: '/reset',
				examples: ['/reset'],
				options: []
			}
		]

		if (this.messengerEnchancedServicesCapabilities.enableImageGeneration) {
			const imageGenerationCommands = [
				{
					command: '/diffuse',
					description: 'Genera una imagen a partir de un prompt optimizando el texto mediante IA',
					usage: '/diffuse <prompt>',
					examples: ['/diffuse Un gato aterrizando en Marte'],
					options: []
				},
				{
					command: '/diffuseraw',
					description:
						'Genera una imagen a partir de un prompt sin procesar que se enviará directamente al modelo de generación',
					usage: '/diffuseraw [-s=123456] <prompt>',
					examples: [
						'/diffuseraw Un gato aterrizando en Marte',
						'/diffuseraw -s=123456 Un gato aterrizando en Marte'
					],
					options: [
						{
							name: '-s',
							description:
								'Semilla para la generación de la imagen. Una semilla es un número entero que se utiliza para generar la imagen de forma determinista. Un mismo prompt y semilla siempre generará la misma imagen.',
							type: 'number',
							example: '/diffuse -s=123456 Un gato aterrizando en Marte',
							required: false
						}
					]
				}
			]
			commands.push(...imageGenerationCommands)
		}

		return commands
	}

	private async isCommand(message: Message): Promise<boolean> {
		if (!message.content.text) return false

		const commands = this.getCommands().map(command => command.command)
		const command = message.content.text.split(' ')[0]

		return commands.includes(command)
	}

	private async hadleCommand(message: Message): Promise<void> {
		const command = message.content.text.split(' ')?.[0]

		switch (command) {
			case '/diffuseraw':
			case '/diffuse':
				await this.diffusse(message)
				break

			case '/reset':
				this.clearBotMemory(message)
				break
			default:
				break
		}
	}

	// ===================================
	// Clear
	// ===================================
	private async clearBotMemory(message: Message): Promise<void> {
		const chatId = message.chatId

		this.clearChatHistory(chatId)

		this.logger.log(`[${this.botName()}] Bot memory cleared for <<<${chatId}>>>`, 'info')

		const clearedMessage = new Message({
			...message.toPrimitives(),
			id: v4(),
			receiver: message.sender,
			sender: {
				id: message.receiver.id,
				name: 'LlmProvider',
				username: 'llmProvider',
				isMe: true
			},
			timestamp: Date.now(),
			isBotMessage: true,
			content: {
				text: `Listo, he olvidado todo lo que habíamos hablado hasta ahora. Tu próximo mensaje será tratado como si fuera el primero para mi.`
			}
		})

		await this.sendMessage(this.user!, clearedMessage)
	}

	// ===================================
	// Diffusion handling
	// ===================================
	private async diffusse(message: Message): Promise<void> {
		// Send disabled service message waiting a bit to prevent spamming
		if (!this.messengerEnchancedServicesCapabilities.enableImageGeneration) {
			await new Promise(resolve =>
				setTimeout(async () => {
					const serviceDisabledMessage = new Message({
						...message.toPrimitives(),
						id: v4(),
						receiver: message.sender,
						sender: {
							id: message.receiver.id,
							name: 'LlmProvider',
							username: 'llmProvider',
							isMe: true
						},
						timestamp: Date.now(),
						isBotMessage: true,
						content: {
							text: `El servicio de generación de imágenes está deshabilitado en este momento.`
						}
					})
					await this.processOutgoingMessage(serviceDisabledMessage)
					await this.sendMessage(this.user!, serviceDisabledMessage)
					resolve(true)
				}, 4000)
			)
			return
		}

		this.logger.log(`[${this.botName()}] New diffusion request received from chat <<<${message.chatId}>>>`, 'info')

		// Prevent multiple diffusions at the same time
		if (this.difusserQueue.isBusy()) {
			this.logger.log(`[${this.botName()}] Diffusion already in progress, advicing user to wait...`, 'info')

			// Send waiting message waiting a bit to prevent spamming
			await new Promise(resolve =>
				setTimeout(async () => {
					const waitingMessage = new Message({
						...message.toPrimitives(),
						id: v4(),
						receiver: message.sender,
						sender: {
							id: message.receiver.id,
							name: 'LlmProvider',
							username: 'llmProvider',
							isMe: true
						},
						timestamp: Date.now(),
						isBotMessage: true,
						content: {
							text: `Estoy generando otras imágenes, tu solicitud se ha añadido a la cola pero no te preocupes, recibirás tu imagen en procesarse tu solicitud.`
						}
					})

					await this.processOutgoingMessage(waitingMessage)
					await this.sendMessage(this.user!, waitingMessage)
					resolve(true)
				}, 4000)
			)

			// Prevent error if ended while waiting
			if (this.difusserQueue.isBusy()) await this.difusserQueue.getDiffusionPromise()
		}

		// Send start confirmation message waiting a bit to prevent spamming
		await new Promise(resolve =>
			setTimeout(async () => {
				const onProgressMessage = new Message({
					...message.toPrimitives(),
					id: v4(),
					receiver: message.sender,
					sender: {
						id: message.receiver.id,
						name: 'LlmProvider',
						username: 'llmProvider',
						isMe: true
					},
					timestamp: Date.now(),
					isBotMessage: true,
					content: {
						text: `Tu solicitud está en marcha, en breve te enviaré la imagen generada...`
					}
				})
				await this.processOutgoingMessage(onProgressMessage)
				await this.sendMessage(this.user!, onProgressMessage)
				resolve(true)
			}, 4000)
		)

		// Add message to diffusion queue
		this.difusserQueue.addToQueue(message)
		this.logger.log(`[${this.botName()}] Diffusion request added to queue`, 'debug')
	}

	protected async processDiffusionQueue(): Promise<void> {
		if (!this.systemOn) {
			this.logger.log(`[${this.botName()}] System is off, difussion queue stopped`, 'info')
			return
		}

		if (this.diffusionQueueRunning) {
			this.logger.log(`[${this.botName()}] Diffusion queue already running, skipping new run...`, 'warn')
			return
		}

		const releaseDiffusionQueueMutex = await this.diffusionQueueMutex.acquire()

		this.diffusionQueueRunning = true

		try {
			for (const message of this.difusserQueue.getMessagesToDiffuse(this.botName())) {
				await this.processDiffusion(message)
				this.difusserQueue.removeFromQueue(message)
			}
		} finally {
			await new Promise(resolve => setTimeout(resolve, 3000))
			releaseDiffusionQueueMutex()
			this.diffusionQueueRunning = false
			await this.processDiffusionQueue()
		}
	}

	private async processDiffusion(message: Message): Promise<void> {
		// Prevent multiple diffusions at the same time
		if (this.difusserQueue.isBusy()) {
			this.logger.log(`[${this.botName()}] Diffusion already in progress, waiting to ending...`, 'debug')

			// Wait for the current diffusion to end
			await this.difusserQueue.getDiffusionPromise()

			// Wait a random time to prevent race conditions
			const random = Math.floor(Math.random() * 3000) + 3000
			await new Promise(resolve => setTimeout(resolve, random))
		}

		this.logger.log(`[${this.botName()}] Starting diffusion for <<<${message.chatId}>>>`, 'info')

		try {
			const container = await asyncContainer()
			const difussor = container.get<MessageImageGenerator>('Chats.MessageImageGenerator')
			const { model } = await this.getAiModel()

			// Parse arguments
			const command = message.content.text.split(' ')[0]
			const commandArgs = message.content.text.split(' ').slice(1)
			const foundSeedArg = commandArgs.find(param => param.startsWith('-s='))
			const extractedSeed = foundSeedArg ? parseInt(foundSeedArg.split('=')[1]?.replace(/\D/g, '')) : null
			const seed = extractedSeed && !isNaN(extractedSeed) ? extractedSeed : Math.floor(Math.random() * 1000000)
			const prompt = commandArgs.filter(param => !param.startsWith('-s=')).join(' ')

			this.difusserQueue.startDiffusion(
				difussor.generate(model, {
					prompt,
					useRawPrompt: command === '/diffuseraw',
					seed
				})
			)

			const result = await this.difusserQueue.getDiffusionPromise()!

			const messageWithGeneration = new Message({
				...message.toPrimitives(),
				id: v4(),
				isBotMessage: true,
				receiver: message.sender,
				sender: {
					id: message.receiver.id,
					name: 'LlmProvider',
					username: 'llmProvider',
					isMe: true
				},
				timestamp: Date.now(),
				content: {
					text:
						'Aquí tienes tu imagen.\n\n' +
						'Promp utilizado:\n' +
						result.prompt +
						'\n\n' +
						'Semilla:\n' +
						result.seed,
					images: [
						{
							data: result.image,
							type: 'image',
							meta: {
								mime: 'image/png'
							}
						}
					]
				}
			})
			await this.processOutgoingMessage(messageWithGeneration)
			await this.sendMessage(this.user!, messageWithGeneration)
		} catch (error) {
			this.logger.log(`[${this.botName()}] Error diffusing message <<<${error}>>>`, 'error')

			const failedMessage = new Message({
				...message.toPrimitives(),
				id: v4(),
				receiver: message.sender,
				sender: {
					id: message.receiver.id,
					name: 'LlmProvider',
					username: 'llmProvider',
					isMe: true
				},
				timestamp: Date.now(),
				isBotMessage: true,
				content: {
					text: `Lo siento, no he podido generar la imagen. Por favor, intenta de nuevo más tarde.`
				}
			})
			await this.processOutgoingMessage(failedMessage)
			await this.sendMessage(this.user!, failedMessage)
		} finally {
			this.difusserQueue.clearDiffusionInProgress()
		}
	}

	// ===================================
	// Validations
	// ===================================
	protected async messageIsAutoResponse(chatId: string, messageContent: string): Promise<boolean> {
		const chatHistory = this.getChatHistoryBuffer(chatId).getHistory()
		const historyHasMessages = chatHistory.length > 0

		if (!historyHasMessages) return false

		const lastMessage = chatHistory[chatHistory.length - 1]
		const lastMessageHasSameContent = lastMessage.content === messageContent

		if (lastMessageHasSameContent) return true

		const assistantHasRespondedThisMessage = chatHistory.some(
			msg => msg.role === HISTORY_MESSAGE_ROLE.ASSISTANT && msg.content === messageContent
		)

		if (assistantHasRespondedThisMessage) return true

		return false
	}
}
