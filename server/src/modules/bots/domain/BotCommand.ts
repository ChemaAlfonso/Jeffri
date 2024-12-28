export interface BotCommand {
	command: string
	description: string
	usage: string
	examples: string[]
	options: {
		name: string
		description: string
		type: string
		example: string
		required: boolean
	}[]
}
