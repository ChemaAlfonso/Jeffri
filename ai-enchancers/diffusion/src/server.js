require('@dotenvx/dotenvx').config()
const express = require('express')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const app = express()
const port = process.env.PORT
const uploadsDir = path.join(__dirname, '../', 'tmp')
const maxDiffussionsAtOnce = 1
let currentDiffussionsInProgress = 0

// Parse json
app.use(express.json())

app.get('/status', (req, res) => {
	res.json({ status: 'ok' })
})

app.post('/diffuse', async (req, res) => {
	const { name, prompt } = req.body
	let { height, width, seed } = req.body

	// ===================================
	// Validate required fields
	// ===================================
	if (!name) return res.status(400).send('No name provided.')
	if (!prompt) return res.status(400).send('No prompt provided.')

	// ===================================
	// Prepare args
	// ===================================
	const filename = `${name}.png`
	const diffusedFilePath = path.join(uploadsDir, filename)
	seed = seed ? +seed : Math.floor(Math.random() * 1000000000)

	// Size adapt
	const maxHeight = 768
	const minHeight = 80
	const maxWidth = 1360
	const minWidth = 80
	if (!height || isNaN(height) || height < minHeight || height > maxHeight) height = maxHeight
	if (!width || isNaN(width) || width < minWidth || width > maxWidth) width = maxWidth

	// ===================================
	// Prevent max than allowed
	// diffussions at once
	// ===================================
	let waitingIterations = 0
	const maxWaitingIterations = 12
	while (currentDiffussionsInProgress >= maxDiffussionsAtOnce) {
		if (waitingIterations >= maxWaitingIterations) {
			return res.status(503).send('Busy server. Try again later.')
		}

		await new Promise(resolve => setTimeout(resolve, 6000))
		waitingIterations++
	}

	currentDiffussionsInProgress++

	// ===================================
	// Run diffusion process
	// ===================================
	const pythonProcess = spawn('/opt/miniconda/bin/conda', [
		'run',
		'-n',
		'flux',
		'python',
		'src/diffuse.py',
		diffusedFilePath,
		prompt,
		+height,
		+width,
		seed
	])

	let pythonOutput = ''
	pythonProcess.stdout.on('data', data => {
		console.log(`Python output: ${data}`)
		pythonOutput += data.toString()
	})

	pythonProcess.stderr.on('data', data => {
		console.error(`${data}`)
	})

	// ===================================
	// Handle diffusion end
	// ===================================
	pythonProcess.on('close', code => {
		currentDiffussionsInProgress--
		console.log(`Python diffusion process exited with code ${code}`)

		const regex = /<<<script_result=(.*)>>>/g
		const match = regex.exec(pythonOutput)

		if (!match) return res.status(500).send('Error processing the image file.')

		const response = JSON.parse(match[1])

		if (response.status === 'error') return res.status(500).send('Error processing the image file.')

		if (code === 0) {
			try {
				const img = fs.readFileSync(diffusedFilePath)
				res.writeHead(200, { 'Content-Type': 'image/png' })
				res.end(img, 'binary')
			} catch (error) {}
		} else {
			res.status(500).send('Error processing the image file.')
		}

		fs.unlink(diffusedFilePath, err => {
			if (err) {
				console.error(`Error removing file: ${err}`)
			}
		})
	})
})

app.get('*', (req, res) => {
	res.redirect('/status')
})

app.listen(port, '0.0.0.0', () => {
	console.log(`Server listening on http://0.0.0.0:${port}`)
})
