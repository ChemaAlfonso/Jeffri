import { Router, Request } from 'express'
import httpStatus from 'http-status'
import { withHttpAuthMiddleware } from '../middleware/withHttpAuthMiddleware.js'
import { asyncContainer } from '../di/container.js'
import { SearchAiContext } from '../../modules/aiContexts/application/SearchAiContext.js'
import { SearchAllAiContexts } from '../../modules/aiContexts/application/SearchAllAiContexts.js'
import { apiResponse } from '../apiResponse.js'
import { withErrorHandling } from '../middleware/withErrorHandling.js'
import { UnauthorizedError } from '../../modules/shared/domain/UnauthorizedError.js'
import { CreateAiContext } from '../../modules/aiContexts/application/CreateAiContext.js'
import { UnprocesableError } from '../../modules/shared/domain/UnprocesableError.js'
import { UpdateAiContext } from '../../modules/aiContexts/application/UpdateAiContext.js'
import { RemoveAiContext } from '../../modules/aiContexts/application/RemoveAiContext.js'
import { AiContextNotExistsDomainError } from '../../modules/aiContexts/domain/AiContextNotExistsDomainError.js'
import { BOT_NAME } from '../../modules/bots/domain/Bot.js'

const aiContextRouter = Router()

aiContextRouter.get('/api/aicontexts', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const ownerId = req.user?.id

			if (!ownerId) throw new UnauthorizedError()

			const container = await asyncContainer()
			const aiContextSearcher = container.get<SearchAllAiContexts>('AiContexts.SearchAllAiContexts')
			const aiContexts = await aiContextSearcher.run(ownerId)

			res.status(httpStatus.OK).json(apiResponse({ aiContexts }))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'UnauthorizedError',
				message: 'You are not authorized to perform this action',
				publicMessage: 'You are not authorized to perform this action',
				code: httpStatus.FORBIDDEN
			}
		]
	})
})

aiContextRouter.get('/api/aicontexts/:id', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const id = req.params.id
			const ownerId = req.user?.id

			if (!ownerId) throw new UnauthorizedError()

			const container = await asyncContainer()
			const aiContextSearcher = container.get<SearchAiContext>('AiContexts.SearchAiContext')
			const aiContext = await aiContextSearcher.run(id)

			if (!aiContext || aiContext.ownerId !== ownerId) throw new AiContextNotExistsDomainError(id)

			res.status(httpStatus.OK).json(apiResponse({ aiContext }))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'UnauthorizedError',
				message: 'You are not authorized to perform this action',
				publicMessage: 'You are not authorized to perform this action',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'AiContextNotExistsDomainError',
				message: 'AiContext does not exists',
				publicMessage: 'AiContext does not exists',
				code: httpStatus.NOT_FOUND
			}
		]
	})
})

aiContextRouter.put(
	'/api/aicontexts/:id',
	withHttpAuthMiddleware,
	async (
		req: Request & {
			body: {
				name: string
				content: string
				enabledInBots: string
			}
		},
		res
	) => {
		withErrorHandling({
			fn: async () => {
				const ownerId = req.user?.id
				if (!ownerId) throw new UnauthorizedError()

				const { id } = req.params
				const { name, content, enabledInBots, exclusive, enabled } = req.body

				const exclusiveIsBoolean = typeof exclusive === 'boolean'
				const enabledIsBoolean = typeof enabled === 'boolean'
				if (!name || !content || !enabledInBots || !exclusiveIsBoolean || !enabledIsBoolean)
					throw new UnprocesableError()

				if (!Array.isArray(enabledInBots)) throw new UnprocesableError()
				const validBotNames = Object.values(BOT_NAME)
				enabledInBots.forEach((botName: string) => {
					if (!validBotNames.includes(botName as BOT_NAME)) throw new UnprocesableError()
				})

				const container = await asyncContainer()
				const aiContextSearcher = container.get<SearchAiContext>('AiContexts.SearchAiContext')
				const aiContext = await aiContextSearcher.run(id)

				if (aiContext && aiContext?.ownerId !== ownerId) throw new UnauthorizedError()

				if (aiContext) {
					await container.get<UpdateAiContext>('AiContexts.UpdateAiContext').run({
						id,
						ownerId,
						name,
						content,
						enabledInBots,
						exclusive,
						enabled
					})
					res.status(httpStatus.OK).json(apiResponse({}))
				} else {
					const createdAt = Date.now()
					await container.get<CreateAiContext>('AiContexts.CreateAiContext').run({
						id,
						ownerId,
						name,
						content,
						enabledInBots,
						exclusive,
						enabled,
						createdAt
					})
					res.status(httpStatus.CREATED).json(apiResponse({}))
				}
			},
			httpResponse: res,
			errorMap: [
				{
					constructorName: 'UnprocesableError',
					message: 'You must provide all the fields',
					publicMessage: 'You must provide all the fields',
					code: httpStatus.UNPROCESSABLE_ENTITY
				},
				{
					constructorName: 'UnauthorizedError',
					message: 'You are not authorized to perform this action',
					publicMessage: 'You are not authorized to perform this action',
					code: httpStatus.FORBIDDEN
				},
				{
					constructorName: 'AiContextNotExistsDomainError',
					message: 'AiContext does not exists',
					publicMessage: 'AiContext does not exists',
					code: httpStatus.NOT_FOUND
				}
			]
		})
	}
)

aiContextRouter.delete('/api/aicontexts/:id', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const { id } = req.params
			const { id: logedUserId } = req.user!

			const container = await asyncContainer()
			const aiContextSearcher = container.get<SearchAiContext>('AiContexts.SearchAiContext')
			const aiContext = await aiContextSearcher.run(id)

			if (!aiContext) throw new AiContextNotExistsDomainError(id)

			if (aiContext?.ownerId !== logedUserId) throw new UnauthorizedError()

			await container.get<RemoveAiContext>('AiContexts.RemoveAiContext').run(id)

			res.status(httpStatus.OK).json(apiResponse({}))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'UnauthorizedError',
				message: 'You are not authorized to perform this action',
				publicMessage: 'You are not authorized to perform this action',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'AiContextNotExistsDomainError',
				message: 'AiContext does not exists',
				publicMessage: 'AiContext does not exists',
				code: httpStatus.NOT_FOUND
			}
		]
	})
})

export { aiContextRouter }
