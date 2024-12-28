import { MessageAttachment, MessageAttachmentImage } from './Message.js'

export interface MessageAttachmentVisor {
	describe(imageAttachment: MessageAttachment<MessageAttachmentImage>): Promise<string>
}
