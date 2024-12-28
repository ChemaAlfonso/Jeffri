import { io, Socket } from 'socket.io-client'

const wsUrl = import.meta.env.VITE_SOCKET_URL

let connectionPromise: Promise<any> | null = null
class SocketService {
	private socket: Socket | null = null
	private _isConnected: boolean = false

	async connect(): Promise<{ ok: boolean }> {
		if (connectionPromise) return await connectionPromise

		connectionPromise = new Promise((resolve, reject) => {
			this.socket = io(wsUrl, { withCredentials: true })

			this.socket.on('connect', () => {
				console.log('Connected to server')
			})

			this.socket.on('connect_error', async (error: any) => {
				const errorMessage = error instanceof Error ? error.message : 'Error connecting to server'
				connectionPromise = null
				this.socket = null
				this._isConnected = false
				await new Promise(resolve => setTimeout(resolve, 1000))
				reject(new Error(errorMessage))
			})

			this.socket.on('auth:connected', () => {
				resolve({ ok: true })
				this._isConnected = true
			})

			this.socket.on('auth:error', (error: any) => {
				this.socket = null
				connectionPromise = null
				this._isConnected = false
				reject(error)
			})
		})

		return await connectionPromise
	}

	on(event: string, callback: (data: any) => void) {
		if (this.socket) {
			this.socket.on(event, callback)
		}
	}

	emit(event: string, data: any) {
		if (this.socket) {
			this.socket.emit(event, data)
		}
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect()
			console.log('Live connection disabled')
		}

		connectionPromise = null
	}

	isConnected() {
		return this._isConnected
	}
}

export const socket = new SocketService()
