import { Router, Request } from 'express'
import httpStatus from 'http-status'
import { withHttpAuthMiddleware } from '../middleware/withHttpAuthMiddleware.js'
import { UnauthorizedError } from '../../modules/shared/domain/UnauthorizedError.js'
import { UnprocesableError } from '../../modules/shared/domain/UnprocesableError.js'
import { apiResponse } from '../apiResponse.js'
import { asyncContainer } from '../di/container.js'
import { withErrorHandling } from '../middleware/withErrorHandling.js'
import { CreateModelConfig } from '../../modules/modelConfigs/application/CreateModelConfig.js'
import { RemoveModelConfig } from '../../modules/modelConfigs/application/RemoveModelConfig.js'
import { SearchModelConfig } from '../../modules/modelConfigs/application/SearchModelConfig.js'
import { UpdateModelConfig } from '../../modules/modelConfigs/application/UpdateModelConfig.js'
import { ModelConfigNotExistsDomainError } from '../../modules/modelConfigs/domain/ModelConfigNotExistsDomainError.js'
import { SearchModelConfigByOwner } from '../../modules/modelConfigs/application/SearchModelConfigByOwner.js'
import { LLM_MODEL } from '../../modules/bots/domain/LlmProvider.js'
import { ModelConfigModelNotExistsDomainError } from '../../modules/modelConfigs/domain/ModelConfigModelNotExistsDomainError.js'

const modelConfigRouter = Router()

modelConfigRouter.get('/api/modelconfigs/mine', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const ownerId = req.user?.id

			if (!ownerId) throw new UnauthorizedError()

			const container = await asyncContainer()
			const modelConfigSearcher = container.get<SearchModelConfigByOwner>('ModelConfigs.SearchModelConfigByOwner')
			const modelConfig = await modelConfigSearcher.run(ownerId)

			res.status(httpStatus.OK).json(apiResponse({ modelConfig }))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'UnauthorizedError',
				message: 'You are not authorized to perform this action',
				publicMessage: 'You are not authorized to perform this action',
				code: httpStatus.FORBIDDEN
			}
		]
	})
})

modelConfigRouter.get('/api/modelconfigs/:id', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const id = req.params.id
			const ownerId = req.user?.id

			if (!ownerId) throw new UnauthorizedError()

			const container = await asyncContainer()
			const modelConfigSearcher = container.get<SearchModelConfig>('ModelConfigs.SearchModelConfig')
			const modelConfig = await modelConfigSearcher.run(id)

			if (!modelConfig || modelConfig.ownerId !== ownerId) throw new ModelConfigNotExistsDomainError(id)

			res.status(httpStatus.OK).json(apiResponse({ modelConfig }))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'UnauthorizedError',
				message: 'You are not authorized to perform this action',
				publicMessage: 'You are not authorized to perform this action',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'ModelConfigNotExistsDomainError',
				message: 'ModelConfig does not exists',
				publicMessage: 'ModelConfig does not exists',
				code: httpStatus.NOT_FOUND
			}
		]
	})
})

modelConfigRouter.put(
	'/api/modelconfigs/:id',
	withHttpAuthMiddleware,
	async (
		req: Request & {
			body: {
				model: string
				config: string
			}
		},
		res
	) => {
		withErrorHandling({
			fn: async () => {
				const ownerId = req.user?.id
				if (!ownerId) throw new UnauthorizedError()

				const { id } = req.params
				const { model, config } = req.body
				if (!model || !config || typeof config !== 'object') throw new UnprocesableError()

				const isValidModel = Object.values(LLM_MODEL).some(modelName => modelName === model)

				if (!isValidModel) throw new ModelConfigModelNotExistsDomainError(model)

				const container = await asyncContainer()
				const modelConfigSearcher = container.get<SearchModelConfig>('ModelConfigs.SearchModelConfig')
				const modelConfig = await modelConfigSearcher.run(id)

				if (modelConfig && modelConfig?.ownerId !== ownerId) throw new UnauthorizedError()

				if (modelConfig) {
					const modelConfigUpdater = container.get<UpdateModelConfig>('ModelConfigs.UpdateModelConfig')
					await modelConfigUpdater.run(id, ownerId, model, config)
					res.status(httpStatus.OK).json(apiResponse({}))
				} else {
					const createdAt = Date.now()
					const modelConfigCreator = container.get<CreateModelConfig>('ModelConfigs.CreateModelConfig')
					await modelConfigCreator.run(id, ownerId, model, config, createdAt)
					res.status(httpStatus.CREATED).json(apiResponse({}))
				}
			},
			httpResponse: res,
			errorMap: [
				{
					constructorName: 'UnprocesableError',
					message: 'You must provide all the fields',
					publicMessage: 'You must provide all the fields',
					code: httpStatus.FORBIDDEN
				},
				{
					constructorName: 'UnauthorizedError',
					message: 'You are not authorized to perform this action',
					publicMessage: 'You are not authorized to perform this action',
					code: httpStatus.FORBIDDEN
				},
				{
					constructorName: 'ModelConfigForUserAlreadyExistsError',
					message: 'ModelConfig for user already exists',
					publicMessage: 'ModelConfig for user already exists',
					code: httpStatus.CONFLICT
				},
				{
					constructorName: 'ModelConfigModelNotExistsDomainError',
					message: 'Model specified is not a valid model name',
					publicMessage: 'Model specified is not a valid model name',
					code: httpStatus.NOT_FOUND
				}
			]
		})
	}
)

modelConfigRouter.delete('/api/modelconfigs/:id', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const { id } = req.params
			const { id: logedUserId } = req.user!

			const container = await asyncContainer()
			const modelConfigSearcher = container.get<SearchModelConfig>('ModelConfigs.SearchModelConfig')
			const modelConfig = await modelConfigSearcher.run(id)

			if (!modelConfig) throw new ModelConfigNotExistsDomainError(id)

			if (modelConfig?.ownerId !== logedUserId) throw new UnauthorizedError()

			await container.get<RemoveModelConfig>('ModelConfigs.RemoveModelConfig').run(id)

			res.status(httpStatus.OK).json(apiResponse({ id }))
		},
		httpResponse: res,
		errorMap: [
			{
				constructorName: 'UnauthorizedError',
				message: 'You are not authorized to perform this action',
				publicMessage: 'You are not authorized to perform this action',
				code: httpStatus.FORBIDDEN
			},
			{
				constructorName: 'ModelConfigNotExistsDomainError',
				message: 'ModelConfig does not exists',
				publicMessage: 'ModelConfig does not exists',
				code: httpStatus.NOT_FOUND
			},
			{
				constructorName: 'ModelConfigCannotRemoveWithChatsDomainError',
				message: 'ModelConfig cannot be removed because it has chats',
				publicMessage: 'ModelConfig cannot be removed because it has chats',
				code: httpStatus.FORBIDDEN
			}
		]
	})
})

export { modelConfigRouter }
