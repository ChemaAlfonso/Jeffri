import { Server, Socket } from 'socket.io'
import { asyncContainer } from '../../../app/di/container.js'
import { SearchByUsername } from '../../users/application/SearchByUsername'
import { JwtAuth } from './JwtAuth'
import { UserPrimitives } from '../../users/domain/User'
import { serverEventEmitter } from '../../../app/serverEvents.js'
import { Logger } from '../domain/Logger.js'

type LogedUserToken = string
type LogedUserId = string

export const initializeSocketEvents = async (io: Server): Promise<Server> => {
	const container = await asyncContainer()
	const logger = container.get<Logger>('Shared.Logger')
	const logedUsersByToken = new Map<LogedUserToken, UserPrimitives>()
	const userSockets = new Map<LogedUserId, Socket[]>()

	// ===================================
	// User sockets management
	// ===================================
	const getActiveUserSockets = (userId: LogedUserId): Socket[] => {
		return userSockets.get(userId) || []
	}

	const addSocketToUser = (userId: LogedUserId, socket: Socket): void => {
		const activeUserSockets = getActiveUserSockets(userId)
		activeUserSockets.push(socket)
		userSockets.set(userId, activeUserSockets)
	}

	const updateSocketUsertoken = (userId: LogedUserId, socket: Socket, newToken: string): void => {
		const activeUserSockets = getActiveUserSockets(userId)
		const socketToUpdate = activeUserSockets.find(s => s === socket)

		if (!socketToUpdate?.user?.token) return

		socketToUpdate.user.token = newToken
		userSockets.set(userId, activeUserSockets)
	}

	const removeSocketFromUser = (userId: LogedUserId, socket: Socket): void => {
		const activeUserSockets = getActiveUserSockets(userId)
		const newActiveUserSockets = activeUserSockets.filter(s => s !== socket)

		if (newActiveUserSockets.length === 0) {
			userSockets.delete(userId)
			return
		}

		userSockets.set(userId, newActiveUserSockets)
	}

	// ===================================
	// User login by token management
	// ===================================
	const getUserFromToken = (token: string): UserPrimitives | undefined => {
		return logedUsersByToken.get(token)
	}

	// ===================================
	// Socket auth management
	// ===================================
	const socketLogin = async (token: string): Promise<void> => {
		if (!token) throw new Error('token not provided')

		const auth = container.get<JwtAuth>('Shared.JwtAuth')
		const { validateToken, getTokenData } = auth

		const isValidToken = validateToken(String(token)).ok
		if (!isValidToken) throw new Error('[WS] Invalid token')

		const tokenData = getTokenData(String(token))

		const isValidTokenType = tokenData && typeof tokenData === 'object'
		const tokenHasUsername = tokenData?.hasOwnProperty('username')
		const tokenHasId = tokenData?.hasOwnProperty('id')
		if (!isValidTokenType || !tokenHasUsername || !tokenHasId) {
			throw new Error('[WS] Invalid token data')
		}

		const user = await container.get<SearchByUsername>('Users.SearchByUsername').run(tokenData.username)

		if (!user) throw new Error('[WS] User not found')

		logedUsersByToken.set(token, user)
	}

	io.on('connection', async socket => {
		if (!socket.user) throw new Error('User not provided')

		const { token } = socket.user
		logger.log(`[WS] User starting connection, waiting socket login...`, 'info')

		socket.on('disconnect', async () => {
			const user = getUserFromToken(token)
			if (user) {
				removeSocketFromUser(user.id, socket)
				logedUsersByToken.delete(token)
			}
			logger.log(`[WS] User disconnected: <<<${user?.id || token}>>>`, 'info')
		})

		try {
			await socketLogin(token)
			socket.emit('auth:connected', { message: 'Connected to the server' })
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : '[WS] Unknown error'
			logger.log(errorMessage)
			socket.emit('auth:error', { message: errorMessage })
			socket.disconnect(true)
			return
		}

		const user = getUserFromToken(token)

		if (!user) {
			logger.log('[WS] User not logged in, disconnecting', 'info')
			socket.emit('auth:error', { message: '[WS] User not logged in' })
			socket.disconnect()
			return
		}

		logger.log(`[WS] User connected: <<<${user.id}>>>`, 'info')
		addSocketToUser(user.id, socket)

		// ===================================
		// Telegram incoming events
		// ===================================
		socket.on('telegram:password:set', async password => {
			serverEventEmitter.emit('telegram:password:set', { password, user })
		})

		socket.on('telegram:otp:set', async otp => {
			serverEventEmitter.emit('telegram:otp:set', { otp, user })
		})
	})

	// ===================================
	// Auth incoming events
	// ===================================
	serverEventEmitter.on(
		'session:refreshed',
		async ({ userId, oldtoken, newToken }: { userId: string; oldtoken: string; newToken: string }) => {
			const userSocketToUpdate = getActiveUserSockets(userId).find(s => s?.user?.token === oldtoken)
			if (userSocketToUpdate) updateSocketUsertoken(userId, userSocketToUpdate, newToken)

			const logedUser = logedUsersByToken.get(oldtoken)
			if (logedUser) {
				logedUsersByToken.delete(oldtoken)
				logedUsersByToken.set(newToken, logedUser)
			}
		}
	)

	serverEventEmitter.on('session:expired', async ({ userId, token }: { userId: string; token: string }) => {
		const userSocketToUpdate = getActiveUserSockets(userId).find(s => s?.user?.token === token)
		if (userSocketToUpdate) {
			userSocketToUpdate.emit('auth:error', { message: 'Session expired' })
			userSocketToUpdate.disconnect()
		}

		const logedUser = logedUsersByToken.get(token)
		if (logedUser) {
			logedUsersByToken.delete(token)
		}
	})

	// ===================================
	// Whatsapp outgoing events
	// ===================================
	serverEventEmitter.on('whatsapp:qr', async ({ qr, user: userRequesting }) => {
		const sockets = getActiveUserSockets(userRequesting.id)
		sockets.forEach(socket => {
			socket.emit('whatsapp:qr', qr)
		})
	})

	serverEventEmitter.on('whatsapp:ready', async ({ user: userRequesting }) => {
		const sockets = getActiveUserSockets(userRequesting.id)
		sockets.forEach(socket => {
			socket.emit('whatsapp:ready')
		})
	})

	serverEventEmitter.on('whatsapp:closedconnection', async ({ user: userRequesting }) => {
		const sockets = getActiveUserSockets(userRequesting.id)
		sockets.forEach(socket => {
			socket.emit('whatsapp:closedconnection')
		})
	})

	// ===================================
	// Telegram outgoing events
	// ===================================
	serverEventEmitter.on('telegram:password:request', async ({ user: userRequesting }) => {
		const sockets = getActiveUserSockets(userRequesting.id)
		sockets.forEach(socket => {
			socket.emit('telegram:password:request')
		})
	})
	serverEventEmitter.on('telegram:otp:request', async ({ user: userRequesting }) => {
		const sockets = getActiveUserSockets(userRequesting.id)
		sockets.forEach(socket => {
			socket.emit('telegram:otp:request')
		})
	})

	serverEventEmitter.on('telegram:failed', async ({ user: userRequesting }) => {
		const sockets = getActiveUserSockets(userRequesting.id)
		sockets.forEach(socket => {
			socket.emit('telegram:failed', { message: 'Telegram cannot connect' })
		})
	})

	serverEventEmitter.on('telegram:ready', async ({ user: userRequesting }) => {
		const sockets = getActiveUserSockets(userRequesting.id)
		sockets.forEach(socket => {
			socket.emit('telegram:ready', { message: 'Telegram connected' })
		})
	})

	serverEventEmitter.on('telegram:disconected', async ({ user: userRequesting }) => {
		const sockets = getActiveUserSockets(userRequesting.id)
		sockets.forEach(socket => {
			socket.emit('telegram:disconected', { message: 'Telegram connected' })
		})
	})

	return io
}
