import { JwtAuth } from '../../modules/shared/infrastructure/JwtAuth.js'
import { RefreshSession } from '../../modules/users/application/RefreshSession.js'
import { SessionPrimitives } from '../../modules/users/domain/User.js'
import { asyncContainer } from '../di/container.js'
import { Request, Response } from 'express'
import uap from 'ua-parser-js'
import { serverEventEmitter } from '../serverEvents.js'
import { getEnv } from '../../getEnv.js'

export const useSessions = () => {
	const generateSessionData = async (req: Request, tokenData: Record<string, string>) => {
		const container = await asyncContainer()

		const auth = container.get<JwtAuth>('Shared.JwtAuth')
		const token = auth.generateToken(tokenData)
		const refreshToken = auth.generateRefreshToken()
		const refreshTokenData = auth.getTokenData(token)!
		const userAgent = req.headers['user-agent'] || ''
		const userAgentMeta = uap(userAgent)

		const session: SessionPrimitives = {
			ip: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress),
			device:
				userAgentMeta.device.vendor && userAgentMeta.device.model
					? `${userAgentMeta.device.vendor} ${userAgentMeta.device.model}`
					: 'Unknown',
			userAgent: userAgent,
			refreshToken,
			expiresAt: refreshTokenData.exp! * 1000,
			createdAt: Date.now()
		}

		return {
			token,
			refreshToken,
			session
		}
	}

	const addSessionCookiesToResponse = (
		req: Request,
		res: Response,
		sessionData: { token: string; refreshToken: string }
	) => {
		const oneYear = 1000 * 60 * 60 * 24 * 365

		const { token, refreshToken } = sessionData

		const secure = getEnv('REQUIRE_HTTPS_SIGN_IN') === 'true'

		res.cookie('jeffriToken', token, {
			domain: req.hostname,
			path: '/',
			httpOnly: true,
			secure,
			sameSite: 'strict',
			maxAge: oneYear
		}).cookie('jeffriRefreshToken', refreshToken, {
			domain: req.hostname,
			path: '/',
			httpOnly: true,
			secure,
			sameSite: 'strict',
			maxAge: oneYear
		})

		return res
	}

	const clearSessionCookiesFromResponse = (res: Response) => {
		res.clearCookie('jeffriToken').clearCookie('jeffriRefreshToken')
	}

	type RefreshSessionResult = { ok: false } | { ok: true; token: string; session: SessionPrimitives }
	const refreshSession = async (token: string, req: Request): Promise<RefreshSessionResult> => {
		let refreshToken = req.cookies['jeffriRefreshToken']

		if (!refreshToken) return { ok: false }

		const container = await asyncContainer()

		const auth = container.get<JwtAuth>('Shared.JwtAuth')
		const { getTokenData } = auth

		const expiredTokenData = getTokenData(String(token))!

		try {
			auth.validateToken(String(refreshToken))

			const sessionData = await generateSessionData(req, {
				id: expiredTokenData.id,
				username: expiredTokenData.username
			})

			await container.get<RefreshSession>('Users.RefreshSession')?.run({
				userId: expiredTokenData.id,
				oldrefreshToken: refreshToken,
				session: sessionData.session
			})

			serverEventEmitter.emit('session:refreshed', {
				userId: expiredTokenData.id,
				oldtoken: token,
				newToken: sessionData.token
			})

			return { ok: true, token: sessionData.token, session: sessionData.session }
		} catch (error) {
			return { ok: false }
		}
	}

	const getUserServerSessionDataFromToken = async (token: string) => {
		const container = await asyncContainer()
		const auth = container.get<JwtAuth>('Shared.JwtAuth')
		const { getTokenData } = auth

		const tokenData = getTokenData(String(token))

		if (!tokenData) throw new Error('Invalid token')

		return {
			token,
			id: tokenData.id,
			username: tokenData.username
		}
	}

	return {
		generateSessionData,
		addSessionCookiesToResponse,
		clearSessionCookiesFromResponse,
		refreshSession,
		getUserServerSessionDataFromToken
	}
}
