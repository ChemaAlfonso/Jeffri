import { AvatarProvider } from '../domain/AvatarProvider'

export class DiceBearAvatarProvider implements AvatarProvider {
	private readonly diceBearStyles = [
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

	async generate(seed: string): Promise<string> {
		const style = this.diceBearStyles[Math.floor(Math.random() * this.diceBearStyles.length)]
		return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`
	}
}
