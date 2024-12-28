const { exec } = require('child_process')
const { promisify } = require('util')

const promiseExec = promisify(exec)

// ============================ Usage ============================
// This code uses the OpenAI or Ollama API to fill in the missing translations
// To use it, you need to have an OpenAI api key or the Ollama API running somewhere
// and set the `aiEndpoint` variable to the corresponding URL
// - Get ollama
// https://ollama.com/download
// - Pull the model before running the script
// ollama pull {{modelName}}
// - Then set the model and run the script
// ===============================================================

// ============================ Config ============================
const MODELS = {
	LLAMA3_1: 'llama3.1',
	LLAMA3: 'llama3',
	LLAMA2: 'llama2',
	GEMMA2: 'gemma2',
	GEMMA2_2b: 'gemma2:2b'
}

const baseLang = 'en'

// Local
const aiModel = process.env.model || MODELS.LLAMA3_1
const aiEndpoint = process.env.ollamaEndpoint || 'http://localhost:11434/api/generate'

// OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// ===============================================================

const getAiResponseWithOpenAI = async prompt => {
	const commandBuilder = {
		command: 'curl',
		args: {
			aiEndpoint: 'https://api.openai.com/v1/chat/completions',
			'-H': ['Content-Type: application/json', `Authorization: Bearer ${OPENAI_API_KEY}`],
			'-d': {
				model: process.env.model || 'gpt-4o-mini',
				messages: [
					{
						role: 'system',
						content: 'You are an expert translator and you should follow the user instructions precisely.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				stream: false
			}
		}
	}

	const command = `${commandBuilder.command} ${commandBuilder.args.aiEndpoint} -H '${commandBuilder.args['-H'].join(
		`' -H '`
	)}' -d '${JSON.stringify(commandBuilder.args['-d'])}'`

	const { stdout } = await promiseExec(command)

	const aiResponse = JSON.parse(stdout)?.choices[0]?.message?.content

	return aiResponse
}

const getAiResponseWithOllama = async prompt => {
	const command = `curl ${aiEndpoint} -d '{
        "model": "${aiModel}",
        "prompt": "${prompt}",
        "stream": false
    }'`

	const { stdout } = await promiseExec(command)

	const aiResponse = JSON.parse(stdout)?.response

	return aiResponse
}

const getAiResponse = async prompt => {
	if (OPENAI_API_KEY) {
		return getAiResponseWithOpenAI(prompt)
	}
	return getAiResponseWithOllama(prompt)
}

const formatTranslationResult = text => {
	return text.trim().replace(/\n/g, '')
}

const aiTranslateText = async (text, toLang) => {
	// If the text is already in the target language, return it as is
	if (toLang === baseLang) return formatTranslationResult(text)

	console.log('\x1b[33m%s\x1b[0m', `Translating text: ${text}`)

	const prompt = `
        I will provide you with a text in "${baseLang}" and you should provide the translation in "${toLang}".
        Do not change the text in any way, just provide the translation.
        For example if i tell you "Mes" you should respond with "Month" and nothing else. NO MORE WORDS.
        
        Here is the text: 
        
        ${text}
    `
		.trim()
		.replace(/"/g, '\\"')
		.replace(/(\n|\t|\s+)/g, ' ')

	const aiResponse = (await getAiResponse(prompt))?.replace(/\n/g, '')

	if (!aiResponse) throw new Error('No response from IA')

	console.log('\x1b[32m%s\x1b[0m', `Translated text to [${toLang}]: ${aiResponse}`)

	return formatTranslationResult(aiResponse)
}

module.exports = { aiTranslateText }
