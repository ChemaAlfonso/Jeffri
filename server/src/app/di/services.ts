import { ContainerBuilder, Definition, Reference } from 'node-dependency-injection'
import { SQLiteDb } from '../../modules/shared/infrastructure/SQLiteDb.js'
import { CreateUser } from '../../modules/users/application/CreateUser.js'
import { SQLiteUserRepository } from '../../modules/users/infrastructure/SqLiteUserRepository.js'
import { BcryptPasswordHasher } from '../../modules/users/infrastructure/BcryptPasswordHasher.js'
import { SearchByUsername } from '../../modules/users/application/SearchByUsername.js'
import { JwtAuth } from '../../modules/shared/infrastructure/JwtAuth.js'
import { RemoveUser } from '../../modules/users/application/RemoveUser.js'
import { SQLiteContactRepository } from '../../modules/contacts/infrastructure/SqLiteContactRepository.js'
import { SearchContact } from '../../modules/contacts/application/SearchContact.js'
import { SearchAllContacts } from '../../modules/contacts/application/SearchAllContacts.js'
import { CreateContact } from '../../modules/contacts/application/CreateContact.js'
import { UpdateContact } from '../../modules/contacts/application/UpdateContact.js'
import { RemoveContact } from '../../modules/contacts/application/RemoveContact.js'
import { BaileysWhatsappMessenger } from '../../modules/bots/infrastructure/messaging/whatsapp/baileys/BaileysWhatsappMessenger.js'
import { SearchByBotHandler } from '../../modules/contacts/application/SearchByBotHandler.js'
import { OllamaLlmProvider } from '../../modules/bots/infrastructure/ia/OllamaLlmProvider.js'
import { WhatsappMessengerManager } from '../../modules/bots/infrastructure/messaging/whatsapp/WhatsappMessengerManager.js'
import { TelegramMessengerManager } from '../../modules/bots/infrastructure/messaging/telegram/TelegramMessengerManager.js'
import { GramJsTelegramMessenger } from '../../modules/bots/infrastructure/messaging/telegram/gramjs/GramJsTelegramMessenger.js'
import { UpdateUser } from '../../modules/users/application/UpdateUser.js'
import { SearchUser } from '../../modules/users/application/SearchUser.js'
import { CreateAiContext } from '../../modules/aiContexts/application/CreateAiContext.js'
import { RemoveAiContext } from '../../modules/aiContexts/application/RemoveAiContext.js'
import { SearchAiContext } from '../../modules/aiContexts/application/SearchAiContext.js'
import { UpdateAiContext } from '../../modules/aiContexts/application/UpdateAiContext.js'
import { SQLiteAiContextRepository } from '../../modules/aiContexts/infrastructure/SqLiteAiContextRepository.js'
import { SearchAiContextByBotName } from '../../modules/aiContexts/application/SearchAiContextByBotName.js'
import { SearchAllAiContexts } from '../../modules/aiContexts/application/SearchAllAiContexts.js'
import { baseContexts } from '../../modules/bots/infrastructure/ia/contexts/baseContext.js'
import { WinstonLogger } from '../../modules/shared/infrastructure/logging/WinstonLogger.js'
import { CreateModelConfig } from '../../modules/modelConfigs/application/CreateModelConfig.js'
import { RemoveModelConfig } from '../../modules/modelConfigs/application/RemoveModelConfig.js'
import { SearchModelConfig } from '../../modules/modelConfigs/application/SearchModelConfig.js'
import { UpdateModelConfig } from '../../modules/modelConfigs/application/UpdateModelConfig.js'
import { SQLiteModelConfigRepository } from '../../modules/modelConfigs/infrastructure/SqLiteModelConfigRepository.js'
import { SearchModelConfigByOwner } from '../../modules/modelConfigs/application/SearchModelConfigByOwner.js'
import { CloseSession } from '../../modules/users/application/CloseSession.js'
import { CreateSession } from '../../modules/users/application/CreateSession.js'
import { RefreshSession } from '../../modules/users/application/RefreshSession.js'
import { SearchSession } from '../../modules/users/application/SearchSession.js'
import { ClearExpiredSessions } from '../../modules/users/application/ClearExpiredSessions.js'
import { DiceBearAvatarProvider } from '../../modules/shared/infrastructure/DiceBearAvatarProvider.js'
import { SQLiteBotRepository } from '../../modules/bots/infrastructure/SqLiteBotRepository.js'
import { CreateBot } from '../../modules/bots/application/CreateBot.js'
import { RemoveBot } from '../../modules/bots/application/RemoveBot.js'
import { SearchAllBots } from '../../modules/bots/application/SearchAllBots.js'
import { SearchBot } from '../../modules/bots/application/SearchBot.js'
import { UpdateBot } from '../../modules/bots/application/UpdateBot.js'
import { SearchBotByName } from '../../modules/bots/application/SearchBotByName.js'
import { ApiMessageAttachmentTranscriber } from '../../modules/bots/infrastructure/ia/ApiMessageAttachmentTranscriber.js'
import { ApiMessageImageGenerator } from '../../modules/bots/infrastructure/ia/ApiMessageImageGenerator.js'
import { DiffuserQueue } from '../../modules/bots/infrastructure/messaging/DiffuserQueue.js'
import { ApiMessageAttachmentVisor } from '../../modules/bots/infrastructure/ia/ApiMessageAttachmentVisor.js'
import { LlmProviderManager } from '../../modules/bots/infrastructure/ia/LlmProviderManager.js'
import { OpenAiLlmProvider } from '../../modules/bots/infrastructure/ia/OpenAiLlmProvider.js'
import { MessengerEnchancedServicesCapabilities } from '../../modules/bots/domain/Messenger.js'
import { getEnv } from '../../getEnv.js'

export const registerServices = async (container: ContainerBuilder) => {
	// ===================================
	// Shared services
	// ===================================
	// Logging
	container.register('Shared.Logger', WinstonLogger).addArgument('shared').addArgument(getEnv('LOG_LEVEL'))
	const loggerReference = new Reference('Shared.Logger')

	// DB
	container.register('Shared.DB', SQLiteDb).addArgument(getEnv('SQLITE_DB'))
	const dbReference = new Reference('Shared.DB')

	// Auth
	container.register('Shared.JwtAuth', JwtAuth)

	// Avatar provider
	container.register('Shared.AvatarProvider', DiceBearAvatarProvider)
	const avatarProviderReference = new Reference('Shared.AvatarProvider')

	// ===================================
	// Users services
	// ===================================
	container.register('Users.PasswordHasher', BcryptPasswordHasher)
	container.register('Users.Repository', SQLiteUserRepository).addArgument(dbReference)
	const userRepositoryReference = new Reference('Users.Repository')
	container.register('Users.CreateUser', CreateUser).addArgument(userRepositoryReference)
	container.register('Users.SearchUser', SearchUser).addArgument(userRepositoryReference)
	container.register('Users.SearchByUsername', SearchByUsername).addArgument(userRepositoryReference)
	container.register('Users.RemoveUser', RemoveUser).addArgument(userRepositoryReference)
	container.register('Users.UpdateUser', UpdateUser).addArgument(userRepositoryReference)
	container.register('Users.CreateSession', CreateSession).addArgument(userRepositoryReference)
	container.register('Users.CloseSession', CloseSession).addArgument(userRepositoryReference)
	container.register('Users.RefreshSession', RefreshSession).addArgument(userRepositoryReference)
	container.register('Users.SearchSession', SearchSession).addArgument(userRepositoryReference)
	container.register('Users.ClearExpiredSessions', ClearExpiredSessions).addArgument(userRepositoryReference)

	// ===================================
	// Contacts services
	// ===================================
	container.register('Contacts.Repository', SQLiteContactRepository).addArgument(dbReference)
	const contactRepositoryReference = new Reference('Contacts.Repository')
	container.register('Contacts.CreateContact', CreateContact).addArgument(contactRepositoryReference)
	container.register('Contacts.UpdateContact', UpdateContact).addArgument(contactRepositoryReference)
	container.register('Contacts.SearchContact', SearchContact).addArgument(contactRepositoryReference)
	container.register('Contacts.RemoveContact', RemoveContact).addArgument(contactRepositoryReference)
	container.register('Contacts.SearchAllContacts', SearchAllContacts).addArgument(contactRepositoryReference)
	container.register('Contacts.SearchByBotHandler', SearchByBotHandler).addArgument(contactRepositoryReference)

	// ===================================
	// Chats services
	// ===================================
	const openAiApiKey = getEnv('OPENAI_API_KEY')
	const diffuserEndpoint = getEnv('DIFFUSER_ENDPOINT')
	const visorEndpoint = getEnv('VISOR_ENDPOINT')
	const transcriberEndpoint = getEnv('TRANSCRIBER_ENDPOINT')
	const messengerEnchancedServicesCapabilities: MessengerEnchancedServicesCapabilities = {
		enableImageGeneration: Boolean(getEnv('DIFFUSER_ENDPOINT')),
		enableImagesVisor: Boolean(getEnv('VISOR_ENDPOINT')),
		enableTranscriptions: Boolean(getEnv('TRANSCRIBER_ENDPOINT'))
	}

	const diffuserQueueDefinition = new Definition(DiffuserQueue)
	container.setDefinition('Chats.DiffuserQueue', diffuserQueueDefinition)
	const diffuserQueueReference = new Reference('Chats.DiffuserQueue')

	const whatsappBotDefinition = new Definition(BaileysWhatsappMessenger)
		.addArgument(loggerReference)
		.addArgument(avatarProviderReference)
		.addArgument(diffuserQueueReference)
		.addArgument(messengerEnchancedServicesCapabilities)
	whatsappBotDefinition.shared = false
	container.setDefinition('Chats.WhatsappMessenger', whatsappBotDefinition)
	container.register('Chats.WhatsappMessengerManager', WhatsappMessengerManager)

	const telegramBotDefinition = new Definition(GramJsTelegramMessenger)
		.addArgument(loggerReference)
		.addArgument(avatarProviderReference)
		.addArgument(diffuserQueueReference)
		.addArgument(messengerEnchancedServicesCapabilities)
	telegramBotDefinition.shared = false
	container.setDefinition('Chats.TelegramMessenger', telegramBotDefinition)
	container.register('Chats.TelegramMessengerManager', TelegramMessengerManager)

	const ollamaLlmProviderDefinition = new Definition(OllamaLlmProvider)
		.addArgument(baseContexts)
		.addArgument(loggerReference)
	ollamaLlmProviderDefinition.shared = false
	container.setDefinition('Chats.OllamaLlmProvider', ollamaLlmProviderDefinition)

	const openaiLlmProviderDefinition = new Definition(OpenAiLlmProvider)
		.addArgument(openAiApiKey)
		.addArgument(baseContexts)
		.addArgument(loggerReference)
	openaiLlmProviderDefinition.shared = false
	container.setDefinition('Chats.OpenLlmProvider', openaiLlmProviderDefinition)

	const managerLlmProviderDefinition = new Definition(LlmProviderManager)
	managerLlmProviderDefinition.shared = false
	container.setDefinition('Chats.LlmProvider', managerLlmProviderDefinition)

	// Audio transcriber
	const messageAttachmentTranscriberDefinition = new Definition(ApiMessageAttachmentTranscriber)
		.addArgument(transcriberEndpoint)
		.addArgument(loggerReference)

	messageAttachmentTranscriberDefinition.shared = false
	container.setDefinition('Chats.MessageAttachmentTranscriber', messageAttachmentTranscriberDefinition)

	// Image describer
	const messageAttachmentVisorDefinition = new Definition(ApiMessageAttachmentVisor)
		.addArgument(visorEndpoint)
		.addArgument(loggerReference)

	messageAttachmentVisorDefinition.shared = false
	container.setDefinition('Chats.MessageAttachmentVisor', messageAttachmentVisorDefinition)

	const imageGenerator = new Definition(ApiMessageImageGenerator)
		.addArgument(diffuserEndpoint)
		.addArgument(loggerReference)

	imageGenerator.shared = false
	container.setDefinition('Chats.MessageImageGenerator', imageGenerator)

	// ===================================
	// AiContext services
	// ===================================
	container.register('AiContexts.Repository', SQLiteAiContextRepository).addArgument(dbReference)
	const aiContextRepositoryReference = new Reference('AiContexts.Repository')
	container.register('AiContexts.CreateAiContext', CreateAiContext).addArgument(aiContextRepositoryReference)
	container.register('AiContexts.UpdateAiContext', UpdateAiContext).addArgument(aiContextRepositoryReference)
	container.register('AiContexts.SearchAiContext', SearchAiContext).addArgument(aiContextRepositoryReference)
	container.register('AiContexts.RemoveAiContext', RemoveAiContext).addArgument(aiContextRepositoryReference)
	container.register('AiContexts.SearchAllAiContexts', SearchAllAiContexts).addArgument(aiContextRepositoryReference)
	container
		.register('AiContexts.SearchAiContextByBotName', SearchAiContextByBotName)
		.addArgument(aiContextRepositoryReference)

	// ===================================
	// ModelConfigs services
	// ===================================
	container.register('ModelConfigs.Repository', SQLiteModelConfigRepository).addArgument(dbReference)
	const modelConfigRepositoryReference = new Reference('ModelConfigs.Repository')
	container.register('ModelConfigs.CreateModelConfig', CreateModelConfig).addArgument(modelConfigRepositoryReference)
	container.register('ModelConfigs.UpdateModelConfig', UpdateModelConfig).addArgument(modelConfigRepositoryReference)
	container.register('ModelConfigs.SearchModelConfig', SearchModelConfig).addArgument(modelConfigRepositoryReference)
	container.register('ModelConfigs.RemoveModelConfig', RemoveModelConfig).addArgument(modelConfigRepositoryReference)
	container
		.register('ModelConfigs.SearchModelConfigByOwner', SearchModelConfigByOwner)
		.addArgument(modelConfigRepositoryReference)

	// ===================================
	// Bots services
	// ===================================
	container.register('Bots.Repository', SQLiteBotRepository).addArgument(dbReference)
	const botRepositoryReference = new Reference('Bots.Repository')
	container.register('Bots.CreateBot', CreateBot).addArgument(botRepositoryReference)
	container.register('Bots.UpdateBot', UpdateBot).addArgument(botRepositoryReference)
	container.register('Bots.SearchBot', SearchBot).addArgument(botRepositoryReference)
	container.register('Bots.RemoveBot', RemoveBot).addArgument(botRepositoryReference)
	container.register('Bots.SearchAllBots', SearchAllBots).addArgument(botRepositoryReference)
	container.register('Bots.SearchBotByName', SearchBotByName).addArgument(botRepositoryReference)
}
