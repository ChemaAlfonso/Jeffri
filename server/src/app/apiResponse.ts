import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { version, author } = require('../../package.json')

const VERSION = version || 'latest'

interface ApiResponse {
	data?: Record<string, any>
	error?: string
	meta: {
		timestamp: number
		version: string
		system: string
		help: string
	}
}

export const apiResponse = (data: Record<string, any>, error?: string) => {
	const responseData: ApiResponse = {
		data,
		meta: {
			timestamp: Date.now(),
			version: VERSION,
			system: 'Jeffri API',
			help: author
		}
	}

	if (error) {
		responseData.error = error
	}

	return responseData
}
