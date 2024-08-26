// src/lib/socketServer.js
import { Server } from 'socket.io';
import { connectToMongoose } from '@/lib/db';
import MediaItem from '@/models/MediaItem';

let io;

export const initSocketServer = (server) => {
    if (io) return; // Prevent multiple initializations

    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected');

        socket.on('commentAdded', async (mediaItemId) => {
            await broadcastComments(mediaItemId);
        });

        socket.on('replyAdded', async (mediaItemId) => {
            await broadcastComments(mediaItemId);
        });
        /* 
                socket.on('itemUpdated', async (itemId) => {
                    await broadcastItemUpdate(itemId);
                }); */

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
};

export const broadcastComments = async (mediaItemId) => {
    if (!io) return;

    await connectToMongoose();
    const mediaItem = await MediaItem.findById(mediaItemId).select('comments');
    const data = JSON.stringify(mediaItem.comments);

    io.emit('commentsUpdated', data);
};

export const broadcastItemUpdate = async (itemId) => {
    if (!io) return;

    await connectToMongoose();
    const mediaItem = await MediaItem.findById(itemId);
    const data = JSON.stringify(mediaItem);

    io.emit('itemUpdated', data);
};