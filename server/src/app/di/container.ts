import { ContainerBuilder } from 'node-dependency-injection'
import { registerServices } from './services.js'

const src = new URL('../../', import.meta.url).pathname
let container: ContainerBuilder | undefined

const buildContainer = async () => {
	const container = new ContainerBuilder(false, src)
	await registerServices(container)
	await container.compile()
	return container
}

export const asyncContainer = async () => {
	if (!container) container = await buildContainer()
	return container
}
