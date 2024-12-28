import jwt from 'jsonwebtoken'
import { getEnv } from '../../../getEnv.js'

const JWT_SECRET_KEY = getEnv('JWT_SECRET_KEY')

export enum JWT_AUTH_ERROR {
	EXPIRED = 'Token expired',
	INVALID = 'Invalid token'
}

export class JwtAuth {
	public generateToken(tokenData: Record<string, string>) {
		return jwt.sign(tokenData, JWT_SECRET_KEY, { expiresIn: '5m' })
	}

	public generateRefreshToken() {
		return jwt.sign({}, JWT_SECRET_KEY, { expiresIn: '30d' })
	}

	public validateToken(token: string) {
		try {
			const decoded = jwt.verify(token, JWT_SECRET_KEY)

			if (typeof decoded !== 'object') throw new Error(JWT_AUTH_ERROR.INVALID)
			if (typeof decoded.exp !== 'number') throw new Error(JWT_AUTH_ERROR.INVALID)

			return {
				ok: true,
				decoded
			}
		} catch (error) {
			const reason = error instanceof jwt.TokenExpiredError ? JWT_AUTH_ERROR.EXPIRED : JWT_AUTH_ERROR.INVALID
			return {
				ok: false,
				reason
			}
		}
	}

	public getTokenData(token: string): jwt.JwtPayload | null {
		try {
			const decoded = jwt.decode(token) as jwt.JwtPayload
			return decoded
		} catch (error) {
			return null
		}
	}
}
