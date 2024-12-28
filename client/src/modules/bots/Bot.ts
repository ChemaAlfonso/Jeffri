export enum BOT_NAME {
	TELEGRAM = 'telegram',
	WHATSAPP = 'whatsapp'
}

export enum BOT_STATUS {
	CONNECTED = 'connected',
	DISCONNECTED = 'disconnected'
}

export interface Bot {
	id: string
	ownerId: string
	name: BOT_NAME
	enabled: boolean
	whitelist: string[]
	blacklist: string[]
	status?: 'connected' | 'disconnected'
	icon?: string
	createdAt: number
}
