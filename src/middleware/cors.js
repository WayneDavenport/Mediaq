// src/middleware/cors.js
import Cors from 'cors';

// Initializing the cors middleware
const cors = Cors({
    methods: ['GET', 'HEAD', 'POST'],
    origin: 'http://192.168.1.109:3000', // Replace with your custom hostname
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

export default cors;
export { runMiddleware };