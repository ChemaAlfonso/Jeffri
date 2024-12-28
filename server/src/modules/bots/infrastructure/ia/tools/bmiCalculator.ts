import { CustomToolConfig } from './tools.js'

export const bmiCalculatorTool = (): CustomToolConfig => {
	const description = {
		type: 'function',
		function: {
			name: 'calculateBMI',
			description: 'Calculate the Body Mass Index (BMI) based on height and weight',
			parameters: {
				type: 'object',
				properties: {
					height: {
						type: 'number',
						description: 'The height in meters'
					},
					weight: {
						type: 'number',
						description: 'The weight in kilograms'
					}
				},
				required: ['height', 'weight']
			}
		}
	}

	const fn = async (args: { height: number; weight: number }) => {
		const bmi = args.weight / (args.height * args.height)
		return `The BMI for a height of ${args.height} meters and a weight of ${args.weight} kilograms is ${bmi.toFixed(
			2
		)}.`
	}

	return { description, fn }
}
