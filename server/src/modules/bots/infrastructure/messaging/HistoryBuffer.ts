import { HistoryMessage } from '../../domain/LlmProvider'

export class HistoryBuffer {
	private readonly history: HistoryMessage[] = []

	constructor(private readonly maxTokens: number) {}

	addMessage(message: HistoryMessage): void {
		this.history.push(message)
		this.fitBufferToMaxTokens()
	}

	getHistory(): HistoryMessage[] {
		return [...this.history]
	}

	clearHistory(): void {
		this.history.length = 0
	}

	private fitBufferToMaxTokens(): void {
		let bufferSize = this.countHistoryTokens()

		while (bufferSize > this.maxTokens) {
			this.history.shift()
			bufferSize = this.countHistoryTokens()
		}
	}

	private countHistoryTokens(): number {
		return Math.ceil(this.getBufferLength() / 4)
	}

	private getBufferLength(): number {
		let bufferSize = 0
		for (const msg of this.history) {
			bufferSize += msg.content.length
		}
		return bufferSize
	}
}
