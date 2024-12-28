import { BOT_NAME } from './Bot.js'
import { Primitivable } from '../../shared/domain/Primitivable.js'

export type MessageAttachmentImage = 'image'
export type MessageAttachmentAudio = 'audio'
export type MessageAttachmentVideo = 'video'
export type MessageAttachmentDocument = 'document'
export type MessageAttachmentType =
	| MessageAttachmentImage
	| MessageAttachmentAudio
	| MessageAttachmentVideo
	| MessageAttachmentDocument

export interface MessageAttachment<T extends MessageAttachmentType> {
	type: T
	data: Buffer
	meta: {
		mime: string
	}
}

export enum MESSAGE_STATUS {
	DELIVERED = 'delivered',
	READED = 'readed',
	PENDING = 'pending'
}

export interface MessagePrimitives {
	id: string
	chatId: string
	sender: {
		id: string
		name: string
		username: string
		isMe: boolean
	}
	receiver: {
		id: string
		name: string
		username: string
		isMe: boolean
	}
	timestamp: number
	content: {
		text: string
		images?: MessageAttachment<MessageAttachmentImage>[]
		audios?: MessageAttachment<MessageAttachmentAudio>[]
		videos?: MessageAttachment<MessageAttachmentVideo>[]
		documents?: MessageAttachment<MessageAttachmentDocument>[]
	}
	meta: {
		ephimeral?: number
	}
	status: MESSAGE_STATUS
	channel: BOT_NAME
	isBotMessage: boolean
}

export class Message extends Primitivable<MessagePrimitives> {
	public readonly id: string
	public readonly chatId: string
	public readonly sender: {
		id: string
		name: string
		username: string
		isMe: boolean
	}
	public readonly receiver: {
		id: string
		name: string
		username: string
		isMe: boolean
	}
	public readonly timestamp: number
	public readonly content: {
		text: string
		images?: MessageAttachment<MessageAttachmentImage>[]
		audios?: MessageAttachment<MessageAttachmentAudio>[]
		videos?: MessageAttachment<MessageAttachmentVideo>[]
		documents?: MessageAttachment<MessageAttachmentDocument>[]
	}
	public readonly meta: {
		ephimeral?: number
	}
	public readonly status: MESSAGE_STATUS
	public readonly channel: BOT_NAME
	public readonly isBotMessage: boolean

	constructor(params: MessagePrimitives) {
		super()

		const { id, chatId, sender, receiver, timestamp, content, meta, status, channel, isBotMessage } = params

		this.id = id
		this.chatId = chatId
		this.sender = sender
		this.receiver = receiver
		this.timestamp = timestamp
		this.content = content
		this.meta = meta
		this.status = status
		this.channel = channel
		this.isBotMessage = isBotMessage
	}

	isAutoMessage(): boolean {
		return this.sender.isMe && this.receiver.isMe
	}

	isEphimeral(): boolean {
		return this.meta.ephimeral !== undefined
	}

	hasImages(): boolean {
		return Boolean(this.content.images?.length)
	}

	hasAudios(): boolean {
		return Boolean(this.content.audios?.length)
	}

	hasVideos(): boolean {
		return Boolean(this.content.videos?.length)
	}

	hasDocuments(): boolean {
		return Boolean(this.content.documents?.length)
	}

	send(): Message {
		return new Message({
			...this.toPrimitives(),
			status: MESSAGE_STATUS.DELIVERED
		})
	}

	read(): Message {
		return new Message({
			...this.toPrimitives(),
			status: MESSAGE_STATUS.READED
		})
	}

	combineWith(message: Message): Message {
		return new Message({
			...this.toPrimitives(),
			content: {
				text: `${this.content.text} ${message.content.text}`,
				images: [...(this.content.images || []), ...(message.content.images || [])],
				audios: [...(this.content.audios || []), ...(message.content.audios || [])],
				videos: [...(this.content.videos || []), ...(message.content.videos || [])],
				documents: [...(this.content.documents || []), ...(message.content.documents || [])]
			}
		})
	}

	toPrimitives(): MessagePrimitives {
		return {
			id: this.id,
			chatId: this.chatId,
			sender: this.sender,
			receiver: this.receiver,
			timestamp: this.timestamp,
			content: this.content,
			meta: this.meta,
			status: this.status,
			channel: this.channel,
			isBotMessage: this.isBotMessage
		}
	}

	static fromPrimitives(primitives: MessagePrimitives): Message {
		return new Message({
			id: primitives.id,
			chatId: primitives.chatId,
			sender: primitives.sender,
			receiver: primitives.receiver,
			timestamp: primitives.timestamp,
			content: primitives.content,
			meta: primitives.meta,
			status: primitives.status,
			channel: primitives.channel,
			isBotMessage: primitives.isBotMessage
		})
	}
}
