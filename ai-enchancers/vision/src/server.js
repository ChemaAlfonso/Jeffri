require('@dotenvx/dotenvx').config()
const express = require('express')
const multer = require('multer')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const app = express()
const port = process.env.PORT

const uploadsDir = path.join(__dirname, 'uploads')

if (!fs.existsSync(uploadsDir)) {
	try {
		fs.mkdirSync(uploadsDir)
		console.log('Directy "uploads" created.')
	} catch (err) {
		console.error(`Error creating "uploads" directory: ${err}`)
	}
}

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadsDir)
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname)
	}
})

const upload = multer({ storage: storage })

app.get('/status', (req, res) => {
	res.json({ status: 'OK' })
})

app.post(
	'/describe',
	(req, res, next) => {
		upload.single('file')(req, res, err => {
			if (err) {
				console.error(`Multer error: ${err}`)
				return res.status(400).send(`Errorloading files: ${err.message}`)
			}
			next()
		})
	},
	(req, res) => {
		if (!req.file) {
			return res.status(400).send('No file uploaded.')
		}

		const imageFilePath = path.join(uploadsDir, req.file.originalname)

		const pythonProcess = spawn('/opt/miniconda/bin/conda', [
			'run',
			'-n',
			'llm-vision',
			'python',
			'src/describe.py',
			imageFilePath
		])

		let pythonOutput = ''

		pythonProcess.stdout.on('data', data => {
			pythonOutput += data.toString()
		})

		pythonProcess.stderr.on('data', data => {
			console.error(`${data}`)
		})

		pythonProcess.on('close', code => {
			if (code === 0) {
				// Remove the temporary file after processing
				fs.unlink(imageFilePath, err => {
					if (err) {
						console.error(`Error removing file: ${err}`)
					}
				})

				res.json({ text: pythonOutput?.trim() || '' })
			} else {
				res.status(500).send('Error processing the image file.')
			}
		})
	}
)

app.get('/', (req, res) => {
	res.redirect('/status')
})

app.listen(port, '0.0.0.0', () => {
	console.log(`Server listening on http://0.0.0.0:${port}`)
})
