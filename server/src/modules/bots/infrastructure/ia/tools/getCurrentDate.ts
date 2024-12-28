import { CustomToolConfig } from './tools.js'

export const getCurrentDateTool = (): CustomToolConfig => {
	const description = {
		type: 'function',
		function: {
			name: 'getCurrentDate',
			description: 'Get the current date',
			parameters: {
				type: 'object',
				properties: {
					format: {
						type: 'string',
						description: 'The format to return the date in, e.g. "YYYY-MM-DD"'
					}
				},
				required: ['format']
			}
		}
	}

	const fn = async (args: { format: string }) => {
		const date = new Date()
		const year = date.getFullYear()
		const month = date.getMonth() + 1
		const day = date.getDate()

		let formattedDate = args.format
		formattedDate = formattedDate.replace('YYYY', year.toString())
		formattedDate = formattedDate.replace('MM', month.toString().padStart(2, '0'))
		formattedDate = formattedDate.replace('DD', day.toString().padStart(2, '0'))

		return formattedDate
	}

	return { description, fn }
}
