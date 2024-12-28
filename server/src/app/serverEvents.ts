import { EventEmitter } from 'events'

class ServerEventEmitter extends EventEmitter {}

export const serverEventEmitter = new ServerEventEmitter()
