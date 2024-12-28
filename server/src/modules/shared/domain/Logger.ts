type ErrorLevels = 'error' | 'warn' | 'info' | 'debug'

export interface Logger {
	log(error: unknown, level?: ErrorLevels): Promise<void>
}
