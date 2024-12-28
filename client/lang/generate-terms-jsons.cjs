const fs = require('fs')
const path = require('path')

const useAi = process.argv.includes('--ia')

// eslint-disable-next-line
;(async () => {
	const { po } = await import('gettext-parser')
	const { aiTranslateText } = await import('./aiTranslationFiller.cjs')

	const currentDir = path.dirname(__filename)
	const input = path.join(currentDir, '/terms-es.pot')
	const output = path.join(currentDir, '/../src/lang/translations.json')
	const langs = {
		es: 'Español',
		en: 'English',
		fr: 'Français',
		it: 'Italiano',
		de: 'Deutsch'
	}

	// Load the .pot file
	const potFileContent = fs.readFileSync(input)
	const parsedPot = po.parse(potFileContent)

	// Preload if already exists
	let translations = {}
	if (fs.existsSync(output)) {
		const existingContent = fs.readFileSync(output, 'utf8')
		translations = JSON.parse(existingContent || '{}')
	}

	for (const [msgid] of Object.entries(parsedPot.translations[''])) {
		if (!msgid) continue

		if (!translations[msgid]) translations[msgid] = {}

		for (const lang of Object.keys(langs)) {
			if (translations[msgid][lang]) continue

			// ====================== AI booster ======================
			// Generating row by row gets better infering
			// results than generating all at once despite being slower
			// Review results if using AI, it's not perfect.
			// ========================================================
			if (useAi) {
				try {
					// eslint-disable-next-line no-await-in-loop
					const translatedText = await aiTranslateText(msgid, langs[lang])
					translations[msgid][lang] = translatedText
				} catch (error) {
					console.error('Error filling translations with AI:', error)
					translations[msgid][lang] = ''
				}
			} else {
				translations[msgid][lang] = ''
			}
		}
	}

	const jsonData = JSON.stringify(translations, null, 4)
	fs.writeFileSync(output, jsonData, 'utf8')

	console.log(`Translations have been written to ${output}`)
})()
