export const useAvatars = () => {
	const diceBearStyles = [
		'adventurer',
		'adventurer-neutral',
		'avataaars',
		'avataaars-neutral',
		'big-ears',
		'big-ears-neutral',
		'big-smile',
		'bottts',
		'bottts-neutral',
		'croodles',
		'croodles-neutral',
		'dylan',
		'fun-emoji',
		'glass',
		'icons',
		'identicon',
		'initials',
		'lorelei',
		'lorelei-neutral',
		'micah',
		'miniavs',
		'notionists',
		'notionists-neutral',
		'open-peeps',
		'personas',
		'pixel-art',
		'pixel-art-neutral',
		'rings',
		'shapes',
		'thumbs'
	]

	const generate = (name: string, style?: string) => {
		style =
			style && diceBearStyles.includes(style)
				? style
				: diceBearStyles[Math.floor(Math.random() * diceBearStyles.length)]
		return `https://api.dicebear.com/9.x/${style}/svg?seed=${name}`
	}

	return {
		generate
	}
}
