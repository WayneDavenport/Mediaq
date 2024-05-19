// src/lib/socket.js
import { Server } from "socket.io";

const SocketHandler = (req, res) => {
    if (res.socket.server.io) {
        console.log("Socket is already running");
    } else {
        console.log("Socket is initializing");
        const io = new Server(res.socket.server);
        res.socket.server.io = io;

        io.on("connection", (socket) => {
            console.log("A user connected");

            socket.on("disconnect", () => {
                console.log("A user disconnected");
            });
        });
    }
    res.end();
};

export default SocketHandler;