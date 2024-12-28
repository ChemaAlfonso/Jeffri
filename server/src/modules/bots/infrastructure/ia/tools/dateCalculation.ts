import { CustomToolConfig } from './tools.js'

export const dateCalculationTool = (): CustomToolConfig => {
	const description = {
		type: 'function',
		function: {
			name: 'dateCalculation',
			description: 'Calculate the difference between two dates or add/subtract days from a given date',
			parameters: {
				type: 'object',
				properties: {
					startDate: {
						type: 'string',
						description: 'The start date in YYYY-MM-DD format'
					},
					endDate: {
						type: 'string',
						description: 'The end date in YYYY-MM-DD format'
					},
					daysToAdd: {
						type: 'number',
						description: 'The number of days to add to the start date'
					},
					daysToSubtract: {
						type: 'number',
						description: 'The number of days to subtract from the start date'
					}
				},
				required: ['startDate']
			}
		}
	}

	const fn = async (args: { startDate: string; endDate?: string; daysToAdd?: number; daysToSubtract?: number }) => {
		const startDate = new Date(args.startDate)
		if (args.endDate) {
			const endDate = new Date(args.endDate)
			const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
			return `The difference between ${args.startDate} and ${args.endDate} is ${diffDays} days.`
		} else if (args.daysToAdd) {
			startDate.setDate(startDate.getDate() + args.daysToAdd)
			return `The new date after adding ${args.daysToAdd} days is ${startDate.toISOString().split('T')[0]}.`
		} else if (args.daysToSubtract) {
			startDate.setDate(startDate.getDate() - args.daysToSubtract)
			return `The new date after subtracting ${args.daysToSubtract} days is ${
				startDate.toISOString().split('T')[0]
			}.`
		} else {
			return 'Please provide either an end date, days to add, or days to subtract.'
		}
	}

	return { description, fn }
}
