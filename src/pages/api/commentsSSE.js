// src/pages/api/commentsSSE.js
import { connectToMongoose } from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import { subscribe, unsubscribe } from '@/lib/pubsub';

let clients = [];

const sendComments = async () => {
    const mediaItems = await MediaItem.find().select('comments');
    const data = `data: ${JSON.stringify(mediaItems)}\n\n`;
    clients.forEach(client => client.res.write(data));
};

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await connectToMongoose();

    clients.push({ req, res });

    const listener = () => sendComments();
    subscribe('commentsUpdated', listener);

    req.on('close', () => {
        clients = clients.filter(client => client.req !== req);
        unsubscribe('commentsUpdated', listener);
        res.end();
    });

    // Send initial comments
    sendComments();
}