import { Router, Request } from 'express'
import httpStatus from 'http-status'
import { apiResponse } from '../apiResponse.js'
import { asyncContainer } from '../di/container.js'
import { CreateUser } from '../../modules/users/application/CreateUser.js'
import { withErrorHandling } from '../middleware/withErrorHandling.js'
import { PasswordHasher } from '../../modules/users/domain/PasswordHasher.js'
import { SearchByUsername } from '../../modules/users/application/SearchByUsername.js'
import { JwtAuth } from '../../modules/shared/infrastructure/JwtAuth.js'
import { withHttpAuthMiddleware } from '../middleware/withHttpAuthMiddleware.js'
import { RemoveUser } from '../../modules/users/application/RemoveUser.js'
import { UnauthorizedError } from '../../modules/shared/domain/UnauthorizedError.js'
import { UpdateUser } from '../../modules/users/application/UpdateUser.js'
import { SearchUser } from '../../modules/users/application/SearchUser.js'
import { CreateSession } from '../../modules/users/application/CreateSession.js'
import { RefreshSession } from '../../modules/users/application/RefreshSession.js'
import { CloseSession } from '../../modules/users/application/CloseSession.js'
import { useSessions } from '../utils/useSessions.js'
import { ClearExpiredSessions } from '../../modules/users/application/ClearExpiredSessions.js'
import { CreateModelConfig } from '../../modules/modelConfigs/application/CreateModelConfig.js'
import { v4 } from 'uuid'
import { LLM_MODEL } from '../../modules/bots/domain/LlmProvider.js'
import { getEnv } from '../../getEnv.js'

const userRouter = Router()

const signUpAllowed = getEnv('ALLOW_SIGN_UP') === 'true'

userRouter.put('/api/register/:id', async (req, res) => {
	withErrorHandling({
		fn: async () => {
			if (!signUpAllowed) {
				res.status(httpStatus.FORBIDDEN).json(apiResponse({ message: 'Sign up is disabled' }))
				return
			}

			const { id } = req.params
			const { name, email, phone, password } = req.body
			const createdAt = Date.now()

			if (!name || !email || !phone || !password) {
				res.status(400).json(apiResponse({ message: 'Missing fields' }))
				return
			}

			const container = await asyncContainer()
			const hashedPass = await container.get<PasswordHasher>('Users.PasswordHasher').hash(password)
			await container.get<CreateUser>('Users.CreateUser').run(id, name, email, phone, hashedPass, [], createdAt)

			// Every user requires a default model config
			const modelConfigCreator = container.get<CreateModelConfig>('ModelConfigs.CreateModelConfig')
			await modelConfigCreator.run(v4(), id, LLM_MODEL.LLAMA3_1, {}, createdAt)

			res.status(httpStatus.CREATED).json(apiResponse({}))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'UserAlreadyExistsDomainError',
				message: 'User already exists',
				publicMessage: 'User already exists',
				code: httpStatus.CONFLICT
			}
		]
	})
})

userRouter.post('/api/login', (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const { username, password } = req.body

			if (!username || !password) throw new Error('Missing login fields')

			const container = await asyncContainer()
			const user = await container.get<SearchByUsername>('Users.SearchByUsername').run(username)

			if (!user) throw new Error('User not found')

			const isValidPassword = await container
				.get<PasswordHasher>('Users.PasswordHasher')
				.verify(password, user.password)

			if (!isValidPassword) throw new Error('Invalid credentials')

			const tokenData = { id: user.id, username }

			const { generateSessionData, addSessionCookiesToResponse } = useSessions()

			const auth = container.get<JwtAuth>('Shared.JwtAuth')

			const { token, refreshToken, session } = await generateSessionData(req, tokenData)

			const oldRefreshToken = req.cookies['jeffriRefreshToken']
			const { ok: oldRefreshTokenIsValid } = oldRefreshToken ? auth.validateToken(oldRefreshToken) : { ok: false }

			if (oldRefreshTokenIsValid) {
				try {
					await container.get<RefreshSession>('Users.RefreshSession')?.run({
						userId: user.id,
						oldrefreshToken: oldRefreshToken,
						session
					})
				} catch (error) {
					await container.get<CreateSession>('Users.CreateSession')?.run({
						userId: user.id,
						session
					})
				}
			} else {
				await container.get<CreateSession>('Users.CreateSession')?.run({
					userId: user.id,
					session
				})
			}

			addSessionCookiesToResponse(req, res, { token, refreshToken })
				.status(httpStatus.CREATED)
				.json(apiResponse(tokenData))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'Error',
				message: 'Invalid credentials',
				publicMessage: 'Invalid credentials',
				code: httpStatus.FORBIDDEN
			}
		]
	})
})

userRouter.post('/api/logout', withHttpAuthMiddleware, (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const { id } = req.user!

			const container = await asyncContainer()

			const refreshToken = req.cookies['jeffriRefreshToken']
			const auth = container.get<JwtAuth>('Shared.JwtAuth')
			const { ok: refreshTokenIsValid } = refreshToken ? auth.validateToken(refreshToken) : { ok: false }

			if (!refreshTokenIsValid) throw new Error('Invalid credentials')

			await container.get<CloseSession>('Users.CloseSession')?.run({
				userId: id,
				refreshToken
			})

			// Also clear expired sessions
			await container.get<ClearExpiredSessions>('Users.ClearExpiredSessions')?.run({ userId: id })

			res.clearCookie('jeffriToken').clearCookie('jeffriRefreshToken').status(httpStatus.OK).json(apiResponse({}))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'Error',
				message: 'Invalid credentials',
				publicMessage: 'Invalid credentials',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'UserSessionNotExistsDomainError',
				message: 'User session not found',
				publicMessage: 'User session not found',
				code: httpStatus.NOT_FOUND
			}
		]
	})
})

userRouter.get('/api/users/auth/refresh', withHttpAuthMiddleware, async (req: Request, res) => {
	// WithHttpMiddleware already validated the token and refreshed it if needed
	res.status(httpStatus.OK).json(apiResponse({ ok: true }))
})

userRouter.get('/api/users/:id', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const { id } = req.params
			const { id: logedUserId } = req.user!

			if (logedUserId !== id) throw new UnauthorizedError()

			const container = await asyncContainer()

			const user = await container.get<SearchUser>('Users.SearchUser').run(id)

			if (!user) throw new Error('User not found')

			const userWithoutPassword = { ...user, password: undefined }

			res.status(httpStatus.OK).json(apiResponse({ user: userWithoutPassword }))
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
				constructorName: 'Error',
				message: 'User not found',
				publicMessage: 'User not found',
				code: httpStatus.NOT_FOUND
			}
		]
	})
})

userRouter.put('/api/users/:id', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const { id } = req.params
			const { id: logedUserId } = req.user!

			if (logedUserId !== id) throw new UnauthorizedError()

			const { name, email, phone, password } = req.body

			if (!name && !email && !phone) {
				res.status(400).json(apiResponse({ message: 'Missing fields' }))
				return
			}

			const container = await asyncContainer()

			const user = await container.get<SearchUser>('Users.SearchUser').run(id)

			if (!user) throw new Error('User not found')

			await container.get<UpdateUser>('Users.UpdateUser').run({
				id,
				name: name || user.name,
				email: email || user.email,
				phone: phone || user.phone,
				password: password
					? await container.get<PasswordHasher>('Users.PasswordHasher').hash(password)
					: undefined
			})

			res.status(httpStatus.OK).json(apiResponse({}))
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

userRouter.delete('/api/users/:id', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const { id } = req.params
			const { id: logedUserId } = req.user!

			if (logedUserId !== id) throw new UnauthorizedError()

			const container = await asyncContainer()
			await container.get<RemoveUser>('Users.RemoveUser').run(id)

			res.status(httpStatus.OK).json(apiResponse({}))
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

export { userRouter }
