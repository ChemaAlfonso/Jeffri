export const useCookies = () => {
	const getCookiesFromRaw = (raw: string) => {
		const cookies: Record<string, string> = {}
		raw.split(';').forEach(cookie => {
			const [key, value] = cookie.split('=')
			cookies[key.trim()] = value
		})
		return cookies
	}

	return {
		getCookiesFromRaw
	}
}
