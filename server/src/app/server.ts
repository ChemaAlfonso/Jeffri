import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import cors from 'cors'
import { initializeSocketEvents } from '../modules/shared/infrastructure/socketEvents.js'
import routes from './routes/routes.js'
import { enableSocketAuthMiddleware } from './middleware/socketAuthMiddleware.js'
import { asyncContainer } from './di/container.js'
import { Logger } from '../modules/shared/domain/Logger.js'
import cookieParser from 'cookie-parser'
import { getEnv } from '../getEnv.js'

export const startServer = async () => {
	// Initialize express app
	const app = express()
	app.set('trust proxy', true)
	app.use(express.json())
	app.use(cookieParser())

	const corsHTTPOrigins = getEnv('HTTP_CORS_ORIGINS')?.split(',') || []
	app.use(
		cors({
			credentials: true,
			origin: (origin, callback) => {
				// Allow requests with no origin (like mobile apps or curl requests)
				if (!origin) return callback(null, true)
				if (corsHTTPOrigins.indexOf(origin) !== -1) {
					callback(null, true)
				} else {
					callback(new Error('Not allowed by CORS'))
				}
			}
		})
	)

	// Api routes
	app.use(routes)

	// Initialize http server
	const server = createServer(app)

	// Initialize socket.io
	const corsWSOrigins = getEnv('WS_CORS_ORIGINS')?.split(',') || []
	const io = new Server(server, {
		cors: {
			credentials: true,
			origin: (origin, callback) => {
				// Allow requests with no origin (like mobile apps or curl requests)
				if (!origin) return callback(null, true)
				if (corsWSOrigins.indexOf(origin) !== -1) {
					callback(null, true)
				} else {
					callback(new Error('Not allowed by CORS'))
				}
			},
			methods: ['GET', 'POST']
		}
	})
	await enableSocketAuthMiddleware(io)
	await initializeSocketEvents(io)

	const container = await asyncContainer()
	const logger = container.get<Logger>('Shared.Logger')

	// Start the server
	const PORT = getEnv('PORT')
	server.listen(PORT, () => {
		logger.log(`Server started on port <<<${PORT}>>>`, 'info')
	})
}
