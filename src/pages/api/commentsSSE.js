// src/pages/api/commentsSSE.js
let clients = [];

const addClient = (res) => {
    clients.push(res);
};

const removeClient = (res) => {
    clients = clients.filter(client => client !== res);
};

const sendToAllClients = (data) => {
    clients.forEach(client => client.write(`data: ${JSON.stringify(data)}\n\n`));
};

export { addClient, removeClient, sendToAllClients };

export default async function handler(req, res) {
    if (req.method === 'GET') {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        addClient(res);

        req.on('close', () => {
            removeClient(res);
        });
    } else if (req.method === 'POST') {
        await requireAuth(req, res, async () => {
            const { mediaId, userId, content, parentId } = req.body;

            if (!mediaId || !userId || !content) {
                return res.status(422).json({ message: 'Invalid input' });
            }

            try {
                await connectToMongoose();

                const mediaItem = await MediaItem.findById(mediaId);

                if (!mediaItem) {
                    return res.status(404).json({ message: 'Media item not found' });
                }

                const newComment = {
                    userId,
                    content,
                    parentId,
                    createdAt: new Date(),
                };

                mediaItem.comments.push(newComment);
                await mediaItem.save();

                sendToAllClients(newComment);

                res.status(201).json(newComment);
            } catch (error) {
                console.error('Failed to save comment:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}