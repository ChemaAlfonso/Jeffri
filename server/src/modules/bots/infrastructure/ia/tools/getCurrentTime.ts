import { CustomToolConfig } from './tools.js'

export const getCurrentTimeToolConfig = (): CustomToolConfig => {
	const description = {
		type: 'function',
		function: {
			name: 'getCurrentTime',
			description: 'Get the current time',
			parameters: {
				type: 'object',
				properties: {
					format: {
						type: 'string',
						description: 'The format to return the time in, e.g. "12-hour" or "24-hour"',
						enum: ['12-hour', '24-hour']
					}
				},
				required: ['format']
			}
		}
	}

	const fn = async (args: { format: '12-hour' | '24-hour' }) => {
		const date = new Date()
		const hours = date.getHours()
		const minutes = date.getMinutes()
		const seconds = date.getSeconds()

		if (args.format === '12-hour') {
			const ampm = hours >= 12 ? 'pm' : 'am'
			const formattedHours = hours % 12 || 12
			return `${formattedHours}:${minutes}:${seconds} ${ampm}`
		} else {
			return `${hours}:${minutes}:${seconds}`
		}
	}

	return { description, fn }
}
