import { Socket } from 'socket.io'
import { Request } from 'express'

declare module 'socket.io' {
	interface Socket {
		user?: {
			token: string
		}
	}
}

declare module 'express' {
	interface Request {
		user?: {
			id: string
			username: string
		}
	}
}
