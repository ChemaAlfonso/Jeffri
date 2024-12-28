import { fileURLToPath } from 'url'
import path from 'path'

const env = process.env.NODE_ENV || 'development'
const envMap: Record<string, string> = {
	development: '.dev.env',
	production: '.env',
	test: '.test.env'
}

const envFilename = envMap[env]

if (!envFilename) {
	throw new Error(`Environment ${env} is not supported`)
}

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../')
const envFile = path.join(projectRoot, envFilename)
process.loadEnvFile(envFile)

const solvedEnv: Record<string, any> = {}

export const getEnv = (key: string): string => {
	if (solvedEnv[key]) return solvedEnv[key]

	const value = process.env[key]
	if (!value) throw new Error(`Environment variable ${key} is not set`)

	// Resolve relative paths to the project root
	if (/^\.?.\//.test(value)) {
		const pathFromRoot = path.join(projectRoot, value)
		solvedEnv[key] = pathFromRoot
	} else {
		solvedEnv[key] = value
	}

	return solvedEnv[key]
}
