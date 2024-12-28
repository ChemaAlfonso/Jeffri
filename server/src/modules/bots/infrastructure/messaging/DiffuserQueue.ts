import { BOT_NAME } from '../../../bots/domain/Bot'
import { Message } from '../../../bots/domain/Message'
import { MessageImageGeneratorResponse } from '../../../bots/domain/MessageImageGenerator'

export class DiffuserQueue {
	private diffusionInProgress: Promise<MessageImageGeneratorResponse> | null = null
	private diffusionQueue: Message[] = []

	constructor() {}

	addToQueue(message: Message): void {
		this.diffusionQueue.push(message)
	}

	removeFromQueue(message: Message): void {
		this.diffusionQueue = this.diffusionQueue.filter(msg => msg.id !== message.id)
	}

	getMessagesToDiffuse(provider: BOT_NAME): Message[] {
		return this.diffusionQueue.filter(msg => msg.channel === provider)
	}

	startDiffusion(difussionPromise: Promise<MessageImageGeneratorResponse>): void {
		this.diffusionInProgress = difussionPromise
	}

	getDiffusionPromise(): Promise<MessageImageGeneratorResponse> | null {
		return this.diffusionInProgress
	}

	clearDiffusionInProgress(): void {
		this.diffusionInProgress = null
	}

	queueLength(): number {
		return this.diffusionQueue.length
	}

	isBusy(): boolean {
		return Boolean(this.diffusionInProgress)
	}
}
