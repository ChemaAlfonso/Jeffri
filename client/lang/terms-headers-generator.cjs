const currentDate = () => {
	const date = new Date()

	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const hours = String(date.getHours()).padStart(2, '0')
	const minutes = String(date.getMinutes()).padStart(2, '0')
	const timezoneOffset = -date.getTimezoneOffset()
	const timezoneOffsetHours = Math.floor(Math.abs(timezoneOffset) / 60)
		.toString()
		.padStart(2, '0')
	const timezoneOffsetMinutes = Math.abs(timezoneOffset) % 60

	const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}${
		timezoneOffset >= 0 ? '+' : '-'
	}${timezoneOffsetHours}${timezoneOffsetMinutes.toString().padStart(2, '0')}`

	return formattedDate
}

const getTermsHeaders = (lang = 'es') => {
	return {
		'Project-Id-Version': 'Jeffri',
		'Report-Msgid-Bugs-To': 'Chema Alfonso <hola@chemaalfonso.com>',
		'Last-Translator': 'Chema Alfonso <hola@chemaalfonso.com>',
		'Language-Team': 'Chema Alfonso <hola@chemaalfonso.com>',
		'PO-Revision-Date': currentDate(),
		Language: lang,
		'Content-Type': 'text/plain; charset=UTF-8'
	}
}

module.exports = {
	getTermsHeaders
}
