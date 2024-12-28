import { Router, Request } from 'express'
import httpStatus from 'http-status'
import { withHttpAuthMiddleware } from '../middleware/withHttpAuthMiddleware.js'
import { asyncContainer } from '../di/container.js'
import { CreateBot } from '../../modules/bots/application/CreateBot.js'
import { RemoveBot } from '../../modules/bots/application/RemoveBot.js'
import { SearchAllBots } from '../../modules/bots/application/SearchAllBots.js'
import { SearchBot } from '../../modules/bots/application/SearchBot.js'
import { UpdateBot } from '../../modules/bots/application/UpdateBot.js'
import { BotNotExistsDomainError } from '../../modules/bots/domain/BotNotExistsDomainError.js'
import { UnprocesableError } from '../../modules/shared/domain/UnprocesableError.js'
import { apiResponse } from '../apiResponse.js'
import { withErrorHandling } from '../middleware/withErrorHandling.js'
import { UnauthorizedError } from '../../modules/shared/domain/UnauthorizedError.js'
import { BOT_NAME } from '../../modules/bots/domain/Bot.js'
import { SearchBotByName } from '../../modules/bots/application/SearchBotByName.js'
import { BotUserAlreadyHasThisBotNameDomainError } from '../../modules/bots/domain/BotUserAlreadyHasThisBotNameDomainError.js'

const botRouter = Router()

botRouter.get('/api/bots', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const ownerId = req.user?.id

			if (!ownerId) throw new UnauthorizedError()

			const container = await asyncContainer()
			const botSearcher = container.get<SearchAllBots>('Bots.SearchAllBots')
			const bots = await botSearcher.run(ownerId)

			res.status(httpStatus.OK).json(apiResponse({ bots }))
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

botRouter.get('/api/bots/:id', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const id = req.params.id
			const ownerId = req.user?.id

			if (!ownerId) throw new UnauthorizedError()

			const container = await asyncContainer()
			const botSearcher = container.get<SearchBot>('Bots.SearchBot')
			const bot = await botSearcher.run(id)

			if (!bot || bot.ownerId !== ownerId) throw new BotNotExistsDomainError(id)

			res.status(httpStatus.OK).json(apiResponse({ bot }))
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
				constructorName: 'BotNotExistsDomainError',
				message: 'Bot does not exists',
				publicMessage: 'Bot does not exists',
				code: httpStatus.NOT_FOUND
			}
		]
	})
})

botRouter.put(
	'/api/bots/:id',
	withHttpAuthMiddleware,
	async (
		req: Request & {
			body: {
				name: BOT_NAME
				enabled: boolean
				whitelist: string[]
				blacklist: string[]
			}
		},
		res
	) => {
		withErrorHandling({
			fn: async () => {
				const ownerId = req.user?.id
				if (!ownerId) throw new UnauthorizedError()

				const { id } = req.params
				const { name, enabled, whitelist, blacklist } = req.body
				if (!name || enabled === undefined || !whitelist || !blacklist) throw new UnprocesableError()

				if (!Object.values(BOT_NAME).includes(name)) throw new UnprocesableError()

				const container = await asyncContainer()
				const botSearcher = container.get<SearchBot>('Bots.SearchBot')
				const bot = await botSearcher.run(id)

				if (bot && bot?.ownerId !== ownerId) throw new UnauthorizedError()

				if (bot) {
					const botUpdater = container.get<UpdateBot>('Bots.UpdateBot')
					await botUpdater.run({
						id,
						ownerId,
						name,
						enabled,
						whitelist,
						blacklist
					})
					res.status(httpStatus.OK).json(apiResponse({}))
				} else {
					const userAlreadyHasProvider = Boolean(
						await container.get<SearchBotByName>('Bots.SearchBotByName').run(ownerId, name)
					)

					if (userAlreadyHasProvider) throw new BotUserAlreadyHasThisBotNameDomainError(ownerId)

					const createdAt = Date.now()
					const botCreator = container.get<CreateBot>('Bots.CreateBot')
					await botCreator.run({
						id,
						ownerId,
						name,
						enabled,
						whitelist,
						blacklist,
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
					constructorName: 'BotUserAlreadyHasThisBotNameDomainError',
					message: 'Bot with already exists for this user',
					publicMessage: 'Bot with already exists for this user',
					code: httpStatus.UNPROCESSABLE_ENTITY
				}
			]
		})
	}
)

botRouter.delete('/api/bots/:id', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const { id } = req.params
			const { id: logedUserId } = req.user!

			const container = await asyncContainer()
			const botSearcher = container.get<SearchBot>('Bots.SearchBot')
			const bot = await botSearcher.run(id)

			if (!bot) throw new BotNotExistsDomainError(id)

			if (bot?.ownerId !== logedUserId) throw new UnauthorizedError()

			await container.get<RemoveBot>('Bots.RemoveBot').run(id)

			res.status(httpStatus.OK).json(apiResponse({ id }))
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
				constructorName: 'BotNotExistsDomainError',
				message: 'Bot does not exists',
				publicMessage: 'Bot does not exists',
				code: httpStatus.NOT_FOUND
			}
		]
	})
})

export { botRouter as botRouter }
