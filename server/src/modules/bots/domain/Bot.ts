import { Primitivable } from '../../shared/domain/Primitivable.js'

export enum BOT_NAME {
	TELEGRAM = 'telegram',
	WHATSAPP = 'whatsapp'
}

export interface BotPrimitives {
	id: string
	ownerId: string
	name: BOT_NAME
	enabled: boolean
	whitelist: string[]
	blacklist: string[]
	createdAt: number
}

export class Bot extends Primitivable<BotPrimitives> {
	constructor(
		public readonly id: string,
		public readonly ownerId: string,
		public readonly name: BOT_NAME,
		public readonly enabled: boolean,
		public readonly whitelist: string[],
		public readonly blacklist: string[],
		public readonly createdAt: number
	) {
		super()
	}

	// ===================================
	// Whitelist
	// ===================================
	isWhitelisted(id: string): boolean {
		return this.whitelist.includes(id)
	}

	addToWhitelist(id: string): Bot {
		const whitelist = [...this.whitelist]
		return new Bot(
			this.id,
			this.ownerId,
			this.name,
			this.enabled,
			[...new Set([...whitelist, id])],
			this.blacklist,
			this.createdAt
		)
	}

	removeFromWhitelist(id: string): Bot {
		const whitelist = [...this.whitelist]
		return new Bot(
			this.id,
			this.ownerId,
			this.name,
			this.enabled,
			whitelist.filter(whitelistedId => whitelistedId !== id),
			this.blacklist,
			this.createdAt
		)
	}

	// ===================================
	// Blacklist
	// ===================================
	isBlacklisted(id: string): boolean {
		return this.blacklist.includes(id)
	}

	addToBlacklist(id: string): Bot {
		const blacklist = [...this.blacklist]
		return new Bot(
			this.id,
			this.ownerId,
			this.name,
			this.enabled,
			this.whitelist,
			[...new Set([...blacklist, id])],
			this.createdAt
		)
	}

	removeFromBlacklist(id: string): Bot {
		const blacklist = [...this.blacklist]
		return new Bot(
			this.id,
			this.ownerId,
			this.name,
			this.enabled,
			this.whitelist,
			blacklist.filter(blacklistedId => blacklistedId !== id),
			this.createdAt
		)
	}

	toPrimitives(): BotPrimitives {
		return {
			id: this.id,
			ownerId: this.ownerId,
			name: this.name,
			enabled: this.enabled,
			whitelist: this.whitelist,
			blacklist: this.blacklist,
			createdAt: this.createdAt
		}
	}

	static fromPrimitives(primitives: BotPrimitives): Bot {
		return new Bot(
			primitives.id,
			primitives.ownerId,
			primitives.name,
			primitives.enabled,
			primitives.whitelist,
			primitives.blacklist,
			primitives.createdAt
		)
	}
}
