import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'

export class SQLiteDb {
	private db?: Database

	constructor(private readonly dbPathname: string) {
		this.connect()
	}

	public async query(sql: string) {
		await this.connect()
		this.db?.run(sql)
	}

	public async get<T>(table: string, where: Record<string, any>) {
		await this.connect()

		const whereClause = Object.entries(where)
			.map(([key, value]) => `${key}=${typeof value === 'string' ? `"${value}"` : value}`)
			.join(' AND ')

		return await this.db?.get<T>(`SELECT * FROM ${table} WHERE ${whereClause}`)
	}

	public async getAll<T>(
		table: string,
		where?: Record<string, any>,
		order?: { by: string; direction: 'ASC' | 'DESC' }
	) {
		await this.connect()

		const whereClause = where
			? Object.entries(where)
					.map(([key, value]) => `${key}=${typeof value === 'string' ? `"${value}"` : value}`)
					.join(' AND ')
			: '1=1'

		const orderByClause = order ? `ORDER BY ${order.by} ${order.direction}` : ''

		const query = await this.db?.all<T[]>(`SELECT * FROM ${table} WHERE ${whereClause} ${orderByClause}`)

		return query || ([] as T[])
	}

	public async upsert(table: string, data: Record<string, any>, id: string) {
		await this.connect()
		const existing = await this.get(table, { id })

		if (existing) {
			await this.update(table, data, { id })
		} else {
			await this.insert(table, data)
		}
	}

	public async remove(table: string, where: Record<string, any>) {
		await this.connect()
		const whereClause = Object.entries(where)
			.map(([key, value]) => `${key}=${typeof value === 'string' ? `"${value}"` : value}`)
			.join(' AND ')
		await this.db?.run(`DELETE FROM ${table} WHERE ${whereClause}`)
	}

	private async insert(table: string, data: Record<string, any>) {
		await this.connect()

		const stmt = await this.db?.prepare(
			`INSERT INTO ${table} (${Object.keys(data).join(',')}) VALUES (${Object.values(data)
				.map(v => '?')
				.join(',')})`
		)
		await stmt?.bind(Object.values(data))
		await stmt?.run(Object.values(data))
	}

	private async update(table: string, data: Record<string, any>, where: Record<string, any>) {
		await this.connect()

		const setClause = Object.entries(data)
			.map(([key, value]) => `${key}=?`)
			.join(',')

		const whereClause = Object.entries(where)
			.map(([key, value]) => `${key}=${typeof value === 'string' ? `"${value}"` : value}`)
			.join(' AND ')

		const stmt = await this.db?.prepare(`UPDATE ${table} SET ${setClause} WHERE ${whereClause}`)

		await stmt?.bind(Object.values(data))
		await stmt?.run(Object.values(data))
	}

	private async connect() {
		if (this.db) return
		this.db = await open({
			filename: this.dbPathname,
			driver: sqlite3.Database
		})
	}
}
