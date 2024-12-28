import { Router, Request } from 'express'
import httpStatus from 'http-status'
import { withHttpAuthMiddleware } from '../middleware/withHttpAuthMiddleware.js'
import { asyncContainer } from '../di/container.js'
import { apiResponse } from '../apiResponse.js'
import { withErrorHandling } from '../middleware/withErrorHandling.js'
import { UnauthorizedError } from '../../modules/shared/domain/UnauthorizedError.js'
import { Messenger } from '../../modules/bots/domain/Messenger.js'
import { SearchByUsername } from '../../modules/users/application/SearchByUsername.js'
import { User } from '../../modules/users/domain/User.js'
import { UserHasNotEnabledProviderDomainError } from '../../modules/users/domain/UserHasNotEnabledProviderDomainError.js'
import { BOT_NAME } from '../../modules/bots/domain/Bot.js'
import { SearchBotByName } from '../../modules/bots/application/SearchBotByName.js'

const botMessengersRouter = Router()

// ===================================
// WhatsApp
// ===================================
botMessengersRouter.get('/api/bots/messengers/startwa', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const username = req.user?.username

			if (!username) throw new UnauthorizedError()

			const container = await asyncContainer()

			const user = await container.get<SearchByUsername>('Users.SearchByUsername').run(username)

			if (!user) throw new UnauthorizedError()

			const userHasProvider = Boolean(
				await container.get<SearchBotByName>('Bots.SearchBotByName').run(user.id, BOT_NAME.WHATSAPP)
			)

			if (!userHasProvider) throw new UserHasNotEnabledProviderDomainError(user.id, BOT_NAME.WHATSAPP)

			const bot = container.get<Messenger>('Chats.WhatsappMessengerManager')

			await bot.connect(User.fromPrimitives(user))

			res.status(httpStatus.OK).json(apiResponse({}))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'Error',
				message: 'Cannot connect to WhatsApp',
				publicMessage: 'Cannot connect to WhatsApp',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UserHasNotEnabledProviderDomainError',
				message: 'User has not enabled WhatsApp provider',
				publicMessage: 'User has not enabled WhatsApp provider',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UnauthorizedError',
				message: 'You are not authorized to perform this action',
				publicMessage: 'You are not authorized to perform this action',
				code: httpStatus.FORBIDDEN
			}
		]
	})
})

botMessengersRouter.get('/api/bots/messengers/stopwa', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const username = req.user?.username

			if (!username) throw new UnauthorizedError()

			const container = await asyncContainer()

			const user = await container.get<SearchByUsername>('Users.SearchByUsername').run(username)

			if (!user) throw new UnauthorizedError()

			const userHasProvider = Boolean(
				await container.get<SearchBotByName>('Bots.SearchBotByName').run(user.id, BOT_NAME.WHATSAPP)
			)

			if (!userHasProvider) throw new UserHasNotEnabledProviderDomainError(user.id, BOT_NAME.WHATSAPP)

			const bot = container.get<Messenger>('Chats.WhatsappMessengerManager')
			await bot.disconnect(User.fromPrimitives(user))

			res.status(httpStatus.OK).json(apiResponse({}))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'Error',
				message: 'Cannot disconnect from WhatsApp',
				publicMessage: 'Cannot disconnect from WhatsApp',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UserHasNotEnabledProviderDomainError',
				message: 'User has not enabled WhatsApp provider',
				publicMessage: 'User has not enabled WhatsApp provider',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UnauthorizedError',
				message: 'You are not authorized to perform this action',
				publicMessage: 'You are not authorized to perform this action',
				code: httpStatus.FORBIDDEN
			}
		]
	})
})

botMessengersRouter.get('/api/bots/messengers/logoutwa', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const username = req.user?.username

			if (!username) throw new UnauthorizedError()

			const container = await asyncContainer()

			const user = await container.get<SearchByUsername>('Users.SearchByUsername').run(username)

			if (!user) throw new UnauthorizedError()

			const userHasProvider = Boolean(
				await container.get<SearchBotByName>('Bots.SearchBotByName').run(user.id, BOT_NAME.WHATSAPP)
			)
			if (!userHasProvider) throw new UserHasNotEnabledProviderDomainError(user.id, BOT_NAME.WHATSAPP)

			const bot = container.get<Messenger>('Chats.WhatsappMessengerManager')
			await bot.logout(User.fromPrimitives(user))

			res.status(httpStatus.OK).json(apiResponse({}))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'Error',
				message: 'Cannot disconnect from WhatsApp',
				publicMessage: 'Cannot disconnect from WhatsApp',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UserHasNotEnabledProviderDomainError',
				message: 'User has not enabled WhatsApp provider',
				publicMessage: 'User has not enabled WhatsApp provider',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UnauthorizedError',
				message: 'You are not authorized to perform this action',
				publicMessage: 'You are not authorized to perform this action',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'CannotLogoutWithoutConnectionDomainError',
				message: 'Cannot logout without connection, please connect first',
				publicMessage: 'Cannot logout without connection, please connect first',
				code: httpStatus.FORBIDDEN
			}
		]
	})
})

botMessengersRouter.get('/api/bots/messengers/wa/status', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const username = req.user?.username

			if (!username) throw new UnauthorizedError()

			const container = await asyncContainer()

			const user = await container.get<SearchByUsername>('Users.SearchByUsername').run(username)

			if (!user) throw new UnauthorizedError()

			const userHasProvider = Boolean(
				await container.get<SearchBotByName>('Bots.SearchBotByName').run(user.id, BOT_NAME.WHATSAPP)
			)

			if (!userHasProvider) throw new UserHasNotEnabledProviderDomainError(user.id, BOT_NAME.WHATSAPP)

			const bot = container.get<Messenger>('Chats.WhatsappMessengerManager')
			const isConnected = await bot.isConnected(User.fromPrimitives(user))

			res.status(httpStatus.OK).json(
				apiResponse({
					status: isConnected ? 'connected' : 'disconnected'
				})
			)
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'UserHasNotEnabledProviderDomainError',
				message: 'User has not enabled WhatsApp provider',
				publicMessage: 'User has not enabled WhatsApp provider',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UnauthorizedError',
				message: 'You are not authorized to perform this action',
				publicMessage: 'You are not authorized to perform this action',
				code: httpStatus.FORBIDDEN
			}
		]
	})
})

// ===================================
// Telegram
// ===================================
botMessengersRouter.get('/api/bots/messengers/starttg', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const username = req.user?.username

			if (!username) throw new UnauthorizedError()

			const container = await asyncContainer()

			const user = await container.get<SearchByUsername>('Users.SearchByUsername').run(username)

			if (!user) throw new UnauthorizedError()

			const userHasProvider = Boolean(
				await container.get<SearchBotByName>('Bots.SearchBotByName').run(user.id, BOT_NAME.TELEGRAM)
			)

			if (!userHasProvider) throw new UserHasNotEnabledProviderDomainError(user.id, BOT_NAME.TELEGRAM)

			const bot = container.get<Messenger>('Chats.TelegramMessengerManager')

			await bot.connect(User.fromPrimitives(user))

			res.status(httpStatus.OK).json(apiResponse({}))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'Error',
				message: 'Cannot connect to Telegram',
				publicMessage: 'Cannot connect to Telegram',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UserHasNotEnabledProviderDomainError',
				message: 'User has not enabled Telegram provider',
				publicMessage: 'User has not enabled Telegram provider',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UnauthorizedError',
				message: 'You are not authorized to perform this action',
				publicMessage: 'You are not authorized to perform this action',
				code: httpStatus.FORBIDDEN
			}
		]
	})
})

botMessengersRouter.get('/api/bots/messengers/stoptg', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const username = req.user?.username

			if (!username) throw new UnauthorizedError()

			const container = await asyncContainer()

			const user = await container.get<SearchByUsername>('Users.SearchByUsername').run(username)

			if (!user) throw new UnauthorizedError()

			const userHasProvider = Boolean(
				await container.get<SearchBotByName>('Bots.SearchBotByName').run(user.id, BOT_NAME.TELEGRAM)
			)

			if (!userHasProvider) throw new UserHasNotEnabledProviderDomainError(user.id, BOT_NAME.TELEGRAM)

			const bot = container.get<Messenger>('Chats.TelegramMessengerManager')
			await bot.disconnect(User.fromPrimitives(user))

			res.status(httpStatus.OK).json(apiResponse({}))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'Error',
				message: 'Cannot disconnect from Telegram',
				publicMessage: 'Cannot disconnect from Telegram',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UserHasNotEnabledProviderDomainError',
				message: 'User has not enabled Telegram provider',
				publicMessage: 'User has not enabled Telegram provider',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UnauthorizedError',
				message: 'You are not authorized to perform this action',
				publicMessage: 'You are not authorized to perform this action',
				code: httpStatus.FORBIDDEN
			}
		]
	})
})

botMessengersRouter.get('/api/bots/messengers/logouttg', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const username = req.user?.username

			if (!username) throw new UnauthorizedError()

			const container = await asyncContainer()

			const user = await container.get<SearchByUsername>('Users.SearchByUsername').run(username)

			if (!user) throw new UnauthorizedError()

			const userHasProvider = Boolean(
				await container.get<SearchBotByName>('Bots.SearchBotByName').run(user.id, BOT_NAME.TELEGRAM)
			)

			if (!userHasProvider) throw new UserHasNotEnabledProviderDomainError(user.id, BOT_NAME.TELEGRAM)

			const bot = container.get<Messenger>('Chats.TelegramMessengerManager')
			await bot.logout(User.fromPrimitives(user))

			res.status(httpStatus.OK).json(apiResponse({}))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'Error',
				message: 'Cannot logout from Telegram',
				publicMessage: 'Cannot logout from Telegram',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UserHasNotEnabledProviderDomainError',
				message: 'User has not enabled Telegram provider',
				publicMessage: 'User has not enabled Telegram provider',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UnauthorizedError',
				message: 'You are not authorized to perform this action',
				publicMessage: 'You are not authorized to perform this action',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'CannotLogoutWithoutConnectionDomainError',
				message: 'Cannot logout without connection, please connect first',
				publicMessage: 'Cannot logout without connection, please connect first',
				code: httpStatus.FORBIDDEN
			}
		]
	})
})

botMessengersRouter.get('/api/bots/messengers/tg/status', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const username = req.user?.username

			if (!username) throw new UnauthorizedError()

			const container = await asyncContainer()

			const user = await container.get<SearchByUsername>('Users.SearchByUsername').run(username)

			if (!user) throw new UnauthorizedError()

			const userHasProvider = Boolean(
				await container.get<SearchBotByName>('Bots.SearchBotByName').run(user.id, BOT_NAME.TELEGRAM)
			)

			if (!userHasProvider) throw new UserHasNotEnabledProviderDomainError(user.id, BOT_NAME.TELEGRAM)

			const bot = container.get<Messenger>('Chats.TelegramMessengerManager')
			const isConnected = await bot.isConnected(User.fromPrimitives(user))

			res.status(httpStatus.OK).json(
				apiResponse({
					status: isConnected ? 'connected' : 'disconnected'
				})
			)
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'UserHasNotEnabledProviderDomainError',
				message: 'User has not enabled Telegram provider',
				publicMessage: 'User has not enabled Telegram provider',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UnauthorizedError',
				message: 'You are not authorized to perform this action',
				publicMessage: 'You are not authorized to perform this action',
				code: httpStatus.FORBIDDEN
			}
		]
	})
})

export { botMessengersRouter }
