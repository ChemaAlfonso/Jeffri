import { CustomToolConfig } from './tools.js'
import QRCode from 'qrcode'

export const qrCodeGeneratorTool = (): CustomToolConfig => {
	const description = {
		type: 'function',
		function: {
			name: 'generateQRCode',
			description: 'Generate a QR code for a given text',
			parameters: {
				type: 'object',
				properties: {
					text: {
						type: 'string',
						description: 'The text to encode in the QR code'
					}
				},
				required: ['text']
			}
		}
	}

	const fn = async (args: { text: string }) => {
		try {
			const qrCodeDataURL = await QRCode.toDataURL(args.text)
			return `Here is the QR code for the text "${args.text}": ${qrCodeDataURL}`
		} catch (error) {
			return 'Failed to generate QR code.'
		}
	}

	return { description, fn }
}
