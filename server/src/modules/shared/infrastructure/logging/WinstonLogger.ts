import winston from 'winston'

import { Logger } from '../../domain/Logger'
import { getEnv } from '../../../../getEnv.js'

export class WinstonLogger implements Logger {
	private readonly logger: winston.Logger
	private logLevelKeys: Record<string, number> = {
		error: 0,
		warn: 1,
		info: 2,
		debug: 3
	}
	private activeLogLevel: number

	constructor(contextName: string = './', logLevel: 'log' | 'error' | 'warn' | 'info' | 'debug') {
		this.activeLogLevel = this.logLevelKeys[logLevel] ?? 0
		const pathName = getEnv('LOG_PATH')

		const transports: (winston.transports.FileTransportInstance | winston.transports.ConsoleTransportInstance)[] = [
			new winston.transports.File({
				level: 'error',
				filename: `${pathName}/${contextName}/error.log`,
				maxFiles: 2,
				maxsize: 5120000
			}),
			new winston.transports.File({
				filename: `${pathName}/${contextName}/combined.log`,
				maxFiles: 2,
				maxsize: 5120000
			}),
			new winston.transports.Console({
				format: winston.format.combine(winston.format.colorize(), winston.format.simple())
			})
		]

		this.logger = winston.createLogger({
			format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
			transports
		})
	}

	async log(error: unknown, level: 'error' | 'warn' | 'info' | 'debug' = 'error'): Promise<void> {
		if (this.activeLogLevel < this.logLevelKeys[level]) return
		const message = error instanceof Error ? error.message + `\n Trace: ${error.stack}` : String(error)
		this.logger.log(level, message)
	}
}
