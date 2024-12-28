import { Router, Request } from 'express'
import httpStatus from 'http-status'
import { withHttpAuthMiddleware } from '../middleware/withHttpAuthMiddleware.js'
import { asyncContainer } from '../di/container.js'
import { SearchContact } from '../../modules/contacts/application/SearchContact.js'
import { SearchAllContacts } from '../../modules/contacts/application/SearchAllContacts.js'
import { apiResponse } from '../apiResponse.js'
import { withErrorHandling } from '../middleware/withErrorHandling.js'
import { UnauthorizedError } from '../../modules/shared/domain/UnauthorizedError.js'
import { CreateContact } from '../../modules/contacts/application/CreateContact.js'
import { UnprocesableError } from '../../modules/shared/domain/UnprocesableError.js'
import { UpdateContact } from '../../modules/contacts/application/UpdateContact.js'
import { RemoveContact } from '../../modules/contacts/application/RemoveContact.js'
import { ContactNotExistsDomainError } from '../../modules/contacts/domain/ContactNotExistsDomainError.js'

const contactRouter = Router()

contactRouter.get('/api/contacts', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const ownerId = req.user?.id

			if (!ownerId) throw new UnauthorizedError()

			const container = await asyncContainer()
			const contactSearcher = container.get<SearchAllContacts>('Contacts.SearchAllContacts')
			const contacts = await contactSearcher.run(ownerId)

			res.status(httpStatus.OK).json(apiResponse({ contacts }))
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

contactRouter.get('/api/contacts/:id', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const id = req.params.id
			const ownerId = req.user?.id

			if (!ownerId) throw new UnauthorizedError()

			const container = await asyncContainer()
			const contactSearcher = container.get<SearchContact>('Contacts.SearchContact')
			const contact = await contactSearcher.run(id)

			if (!contact || contact.ownerId !== ownerId) throw new ContactNotExistsDomainError(id)

			res.status(httpStatus.OK).json(apiResponse({ contact }))
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
				constructorName: 'ContactNotExistsDomainError',
				message: 'Contact does not exists',
				publicMessage: 'Contact does not exists',
				code: httpStatus.NOT_FOUND
			}
		]
	})
})

contactRouter.put(
	'/api/contacts/:id',
	withHttpAuthMiddleware,
	async (
		req: Request & {
			body: {
				name: string
				avatar: string
				phone: string
			}
		},
		res
	) => {
		withErrorHandling({
			fn: async () => {
				const ownerId = req.user?.id
				if (!ownerId) throw new UnauthorizedError()

				const { id } = req.params
				const { name, avatar, botHandlers, contexts } = req.body

				if (!id || !name || !avatar || !botHandlers || !contexts) throw new UnprocesableError()

				if (!Array.isArray(contexts)) throw new UnprocesableError()

				const container = await asyncContainer()
				const contactSearcher = container.get<SearchContact>('Contacts.SearchContact')
				const contact = await contactSearcher.run(id)

				if (contact && contact?.ownerId !== ownerId) throw new UnauthorizedError()

				if (contact) {
					const contactUpdater = container.get<UpdateContact>('Contacts.UpdateContact')
					await contactUpdater.run({ id, ownerId, name, avatar, botHandlers, contexts })
					res.status(httpStatus.OK).json(apiResponse({}))
				} else {
					const createdAt = Date.now()
					const contactCreator = container.get<CreateContact>('Contacts.CreateContact')
					await contactCreator.run({ id, ownerId, name, avatar, botHandlers, contexts, createdAt })
					res.status(httpStatus.CREATED).json(apiResponse({}))
				}
			},
			httpResponse: res,
			errorMap: [
				{
					constructorName: 'UnprocesableError',
					message: 'You must provide all the fields',
					publicMessage: 'You must provide all the fields',
					code: httpStatus.UNPROCESSABLE_ENTITY
				},
				{
					constructorName: 'UnauthorizedError',
					message: 'You are not authorized to perform this action',
					publicMessage: 'You are not authorized to perform this action',
					code: httpStatus.FORBIDDEN
				}
			]
		})
	}
)

contactRouter.delete('/api/contacts/:id', withHttpAuthMiddleware, async (req: Request, res) => {
	withErrorHandling({
		fn: async () => {
			const { id } = req.params
			const { id: logedUserId } = req.user!

			const container = await asyncContainer()
			const contactSearcher = container.get<SearchContact>('Contacts.SearchContact')
			const contact = await contactSearcher.run(id)

			if (!contact) throw new ContactNotExistsDomainError(id)

			if (contact?.ownerId !== logedUserId) throw new UnauthorizedError()

			await container.get<RemoveContact>('Contacts.RemoveContact').run(id)

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
				constructorName: 'ContactNotExistsDomainError',
				message: 'Contact does not exists',
				publicMessage: 'Contact does not exists',
				code: httpStatus.NOT_FOUND
			},
			{
				constructorName: 'ContactCannotRemoveWithChatsDomainError',
				message: 'Contact cannot be removed because it has chats',
				publicMessage: 'Contact cannot be removed because it has chats',
				code: httpStatus.FORBIDDEN
			}
		]
	})
})

export { contactRouter }
