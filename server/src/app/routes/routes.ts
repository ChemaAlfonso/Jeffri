import express, { Router } from 'express'
import path from 'path'
import { contactRouter } from './contacts.routes.js'
import { botMessengersRouter } from './bots.messengers.routes.js'
import { userRouter } from './users.routes.js'
import { apiResponse } from '../apiResponse.js'
import { aiContextRouter } from './aiContexts.routes.js'
import { modelConfigRouter } from './modelConfigs.routes.js'
import { botRouter } from './bots.routes.js'
import { getEnv } from '../../getEnv.js'

const router = Router()

// ===================================
// Server checking
// ===================================
router.get('/api/status', (req, res) => {
	res.json(apiResponse({ status: 'ok' }))
})

// ===================================
// Users endpoints
// ===================================
router.use(userRouter)

// ===================================
// Contacts endpoints
// ===================================
router.use(contactRouter)

// ===================================
// AiContexts endpoints
// ===================================
router.use(aiContextRouter)

// ===================================
// Model config endpoints
// ===================================
router.use(modelConfigRouter)

// ===================================
// External messaging providers endpoints
// ===================================
router.use(botMessengersRouter)
router.use(botRouter)

// ===================================
// Client app
// ===================================
const clientAppPath = getEnv('CLIENT_APP_PATH')
router.use(express.static(clientAppPath))

// Serve static files from the assets directory
router.use('/assets', express.static(path.join(clientAppPath, 'assets')))
router.get('*', (req, res) => {
	res.sendFile(path.join(clientAppPath, 'index.html'))
})

export default router
