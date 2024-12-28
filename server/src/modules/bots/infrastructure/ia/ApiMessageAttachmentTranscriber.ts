import { v4 } from 'uuid'
import { Logger } from '../../../shared/domain/Logger'
import { MessageAttachment, MessageAttachmentAudio } from '../../domain/Message'
import { MessageAttachmentTranscriber } from '../../domain/MessageAttachmentTranscriber'

export class ApiMessageAttachmentTranscriber implements MessageAttachmentTranscriber {
	constructor(private readonly transcriberEndpoint: string, private readonly logger: Logger) {}

	async transcribe(attachment: MessageAttachment<MessageAttachmentAudio>): Promise<string> {
		const file = new File([attachment.data], v4(), {
			type: attachment.meta.mime
		})

		const formData = new FormData()
		formData.append('file', file)

		const trascriptionRequest = await fetch(this.transcriberEndpoint, {
			method: 'POST',
			body: formData
		})

		if (!trascriptionRequest.ok) {
			this.logger.log(`Error transcribing audio: ${trascriptionRequest.statusText}`)
			throw new Error('Error transcribing audio')
		}

		const { text } = await trascriptionRequest.json()

		return text.trim()
	}
}
