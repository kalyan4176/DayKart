import { EventEmitter } from 'events';

export const notificationEmitter = new EventEmitter();
// Max listeners default setup to prevent memory leak warning on many concurrent streams
notificationEmitter.setMaxListeners(1000);
