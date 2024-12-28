const { GettextExtractor, JsExtractors, HtmlExtractors } = require('gettext-extractor')
const { getTermsHeaders } = require('./terms-headers-generator.cjs')

const extractor = new GettextExtractor()

// Extract from scripts any getText function
// () => getText('text')
const parser = extractor
	.createJsParser([
		JsExtractors.callExpression('getText', {
			arguments: {
				text: 0,
				context: 1
			}
		}),
		JsExtractors.callExpression('getplural', {
			arguments: {
				text: 1,
				textPlural: 2,
				context: 3
			}
		})
	])
	.parseFilesGlob('./src/**/*.@(ts|vue)')

// Extract from elements with gettext attr
// <span v-gettext>text</span>
extractor.createHtmlParser([HtmlExtractors.elementContent('[v-gettext]')]).parseFilesGlob('./src/**/*.@(vue)')

extractor
	.createHtmlParser([
		// Extract from elements with getText attr
		// <span :attr="getText('text')"></span>
		HtmlExtractors.embeddedAttributeJs(({ value }) => value.includes('getText'), parser),

		// Extract from elements with getText content
		// <span>{{ getText('text') }}</span>
		HtmlExtractors.embeddedJs('*', parser)
	])
	.parseFilesGlob('./src/**/*.@(vue)')

extractor.savePotFile('./lang/terms-es.pot', getTermsHeaders())

extractor.printStats()
