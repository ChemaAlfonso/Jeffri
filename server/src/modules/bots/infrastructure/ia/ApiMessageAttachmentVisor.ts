import { v4 } from 'uuid'
import { Logger } from '../../../shared/domain/Logger'
import { MessageAttachment, MessageAttachmentImage } from '../../../bots/domain/Message'
import { MessageAttachmentVisor } from '../../../bots/domain/MessageAttachmentVisor'

export class ApiMessageAttachmentVisor implements MessageAttachmentVisor {
	constructor(private readonly descriptorEndpoint: string, private readonly logger: Logger) {}

	async describe(attachment: MessageAttachment<MessageAttachmentImage>): Promise<string> {
		const file = new File([attachment.data], v4(), {
			type: attachment.meta.mime
		})

		const formData = new FormData()
		formData.append('file', file)

		const describeRequest = await fetch(this.descriptorEndpoint, {
			method: 'POST',
			body: formData
		})

		if (!describeRequest.ok) {
			this.logger.log(`Error describing image: ${describeRequest.statusText}`)
			throw new Error('Error describing image')
		}

		const { text } = await describeRequest.json()

		return text.trim()
	}
}
