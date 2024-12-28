export abstract class Primitivable<T> {
	abstract toPrimitives(): T
	static fromPrimitives(primitives: any): any {
		throw new Error('Method not implemented.')
	}
}
