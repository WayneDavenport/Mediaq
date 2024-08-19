// src/lib/pubsub.js
import { EventEmitter } from 'events';

const eventEmitter = new EventEmitter();

export const subscribe = (event, listener) => {
    eventEmitter.on(event, listener);
};

export const unsubscribe = (event, listener) => {
    eventEmitter.off(event, listener);
};

export const publish = (event, data) => {
    eventEmitter.emit(event, data);
};