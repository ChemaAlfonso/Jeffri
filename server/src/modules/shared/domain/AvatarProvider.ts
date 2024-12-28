export interface AvatarProvider {
	generate(seed: string): Promise<string>
}
