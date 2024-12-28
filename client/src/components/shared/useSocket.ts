import { socket } from '@/modules/connection/Socket'

export const useSocket = () => {
	const connect = async () => {
		await socket.connect()
	}

	const disconnect = () => {
		socket.disconnect()
	}

	const isConnected = () => {
		return socket.isConnected()
	}

	const getSocket = () => {
		return socket
	}

	const on = (event: string, callback: (data: any) => void) => {
		getSocket().on(event, callback)
	}

	const emit = (event: string, data: any) => {
		getSocket().emit(event, data)
	}

	return {
		connect,
		disconnect,
		isConnected,
		on,
		emit
	}
}
