// ===================================
// Examples
// ===================================
// {
// 	"type": "function",
// 	"function": {
// 		"name": "getCurrentweather",
// 		"description": "Get the current weather for a location",
// 		"parameters": {
// 			"type": "object",
// 			"properties": {
// 				"location": {
// 					"type": "string",
// 					"description": "The location to get the weather for, e.g. San Francisco, CA"
// 				},
// 				"format": {
// 					"type": "string",
// 					"description": "The format to return the weather in, e.g. 'celsius' or 'fahrenheit'",
// 					"enum": [
// 						"celsius",
// 						"fahrenheit"
// 					]
// 				}
// 			},
// 			"required": [
// 				"location",
// 				"format"
// 			]
// 		}
// 	}
// }
//
// Tool call example:
// "tool_calls": [
// 	{
// 		"function": {
// 			"name": "get_current_weather",
// 			"arguments": {
// 				"format": "celsius",
// 				"location": "Paris"
// 			}
// 		}
// 	}
// ]

import { Tool } from 'ollama'
import { getCurrentTimeToolConfig } from './getCurrentTime.js'
import { getCurrentDateTool } from './getCurrentDate.js'
import { dateCalculationTool } from './dateCalculation.js'
import { qrCodeGeneratorTool } from './qrCodeGenerator.js'
import { bmiCalculatorTool } from './bmiCalculator.js'

export interface CustomToolConfig {
	description: Tool
	fn: (args?: any) => Promise<string>
}

interface ToolCall {
	function: {
		name: string
		arguments: Record<string, any>
	}
}

interface ToolMessage {
	role: 'tool'
	content: string
}

// ===================================
// Tool mapping
// ===================================
export const availableTools: CustomToolConfig[] = [
	getCurrentDateTool(),
	dateCalculationTool(),
	getCurrentTimeToolConfig(),
	qrCodeGeneratorTool(),
	bmiCalculatorTool()
]

const toolCallMap: Record<string, CustomToolConfig['fn']> = {}
for (const tool of availableTools) {
	toolCallMap[tool.description.function.name] = tool.fn
}

// ===================================
// Main tool processing function
// ===================================
export const getMessagesFromToolCalls = async (toolCalls: ToolCall[]): Promise<ToolMessage[]> => {
	const toolMessages: ToolMessage[] = []
	for (const toolCall of toolCalls) {
		const tool = toolCallMap[toolCall.function.name]
		if (!tool) continue
		toolMessages.push({
			role: 'tool',
			content: await tool(toolCall.function.arguments)
		})
	}
	return toolMessages
}
