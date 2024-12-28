import { MessageAttachment, MessageAttachmentAudio } from './Message.js'

export interface MessageAttachmentTranscriber {
	transcribe(audioAttachment: MessageAttachment<MessageAttachmentAudio>): Promise<string>
}
