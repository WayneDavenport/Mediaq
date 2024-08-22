// src/pages/api/initSocket.js
import { initSocketServer } from '@/lib/socketServer';

export default function handler(req, res) {
    if (req.method === 'GET') {
        initSocketServer(req.socket.server);
        res.status(200).json({ message: 'Socket server initialized' });
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}