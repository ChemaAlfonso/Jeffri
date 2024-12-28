import { Request, Response, NextFunction } from 'express'
import { JWT_AUTH_ERROR, JwtAuth } from '../../modules/shared/infrastructure/JwtAuth.js'
import { asyncContainer } from '../di/container.js'
import { useSessions } from '../utils/useSessions.js'
import { RefreshSession } from '../../modules/users/application/RefreshSession.js'
import { serverEventEmitter } from '../serverEvents.js'

export const withHttpAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	let token = req.cookies['jeffriToken']

	if (!token) {
		return res.status(401).json({ error: 'Unauthorized' })
	}

	const container = await asyncContainer()
	const auth = container.get<JwtAuth>('Shared.JwtAuth')
	const { validateToken, getTokenData } = auth
	const {
		refreshSession,
		addSessionCookiesToResponse,
		clearSessionCookiesFromResponse,
		getUserServerSessionDataFromToken
	} = useSessions()

	const validation = validateToken(String(token))
	if (!validation.ok) {
		if (validation.reason !== JWT_AUTH_ERROR.EXPIRED) return res.status(401).json({ error: 'Unauthorized' })

		const refreshSessionResult = await refreshSession(token, req)

		if (!refreshSessionResult.ok) {
			clearSessionCookiesFromResponse(res)
			const expiredTokenData = getTokenData(String(token))!
			serverEventEmitter.emit('session:expired', { userId: expiredTokenData.id, token })
			return res.status(401).json({ error: 'Unauthorized' })
		}

		addSessionCookiesToResponse(req, res, {
			token: refreshSessionResult.token,
			refreshToken: refreshSessionResult.session.refreshToken
		})

		token = refreshSessionResult.token
	}

	const tokenData = getTokenData(String(token))

	if (!tokenData) return res.status(401).json({ error: 'Unauthorized' })

	req.user = await getUserServerSessionDataFromToken(token)
	next()
}
