import { Response } from 'express'
import { apiResponse } from '../apiResponse.js'
import { asyncContainer } from '../di/container.js'
import { Logger } from '../../modules/shared/domain/Logger.js'

export interface ERROR_MAP_ENTRY {
	constructorName: string
	message: string
	publicMessage: string
	code: number
}

export const withErrorHandling = async (params: {
	fn: () => Promise<void>
	errorMap?: ERROR_MAP_ENTRY[]
	httpResponse: Response
}) => {
	const { fn, httpResponse } = params
	const errorMap = params.errorMap || []
	const container = await asyncContainer()
	const logger = container.get<Logger>('Shared.Logger')

	try {
		await fn()
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error'

		for (const [_, error] of Object.entries(errorMap)) {
			if (err instanceof Error && err.constructor.name === error.constructorName) {
				logger.log(errorMessage)
				httpResponse.status(error.code).json(apiResponse({}, error.publicMessage))
				return
			}
		}

		logger.log(errorMessage)
		httpResponse.status(500).json(apiResponse({}, 'Internal Server Error'))
	}
}
