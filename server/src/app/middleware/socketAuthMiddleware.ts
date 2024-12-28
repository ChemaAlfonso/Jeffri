import { Server } from 'socket.io'
import { asyncContainer } from '../di/container.js'
import { JWT_AUTH_ERROR, JwtAuth } from '../../modules/shared/infrastructure/JwtAuth.js'
import { useCookies } from '../utils/useCookies.js'
import { useSessions } from '../utils/useSessions.js'

const { getCookiesFromRaw } = useCookies()

export const enableSocketAuthMiddleware = async (io: Server) => {
	const container = await asyncContainer()
	const { validateToken, getTokenData } = container.get<JwtAuth>('Shared.JwtAuth')
	const { getUserServerSessionDataFromToken } = useSessions()

	io.use(async (socket, next) => {
		const cookies = socket.request.headers.cookie
		if (!cookies) {
			next(new Error('No token provided'))
			return
		}

		const { jeffriToken: token } = getCookiesFromRaw(cookies)

		if (!token) {
			next(new Error('No token provided'))
			return
		}

		const validation = validateToken(token)
		if (!validation.ok) {
			if (validation.reason !== JWT_AUTH_ERROR.EXPIRED) {
				socket.emit('auth:error', { message: 'Invalid token' })
				next(new Error('Invalid token'))
				return
			} else {
				socket.emit('auth:expired', { message: 'Token expired' })
				next(new Error('Token expired'))
				return
			}
		}

		const tokenData = getTokenData(token)

		const isValidTokenType = tokenData && typeof tokenData === 'object'
		const tokenHasUsername = tokenData?.hasOwnProperty('username')
		const tokenHasId = tokenData?.hasOwnProperty('id')
		if (!isValidTokenType || !tokenHasUsername || !tokenHasId) {
			socket.emit('auth:error', { message: 'Invalid token data' })
			next(new Error('Invalid token data'))
			return
		}

		socket.user = await getUserServerSessionDataFromToken(token)
		next()
	})
}
