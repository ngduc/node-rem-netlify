"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socketio = require('socket.io');
exports.setup = (server) => {
    socketio(server).on('connect', (client) => {
        console.log('--- socket.io connection ready');
        client.on('customMessage', (msg) => {
            console.log('on message - ', msg);
            client.emit('customReply', { test: 789 });
        });
    });
};
