import express from 'express';
import path from 'path';
import { Socket } from 'socket.io';
// // https://cycling74.com/forums/midi-over-udp
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const osc = require("osc");

const UDP_PORT = 9000;
const SOCKET_PORT = 8000;

const udpPort = new osc.UDPPort({
    localAddress: "127.0.0.1",
    localPort: UDP_PORT
});
server.listen(SOCKET_PORT);

const requiredValuesForNote = 2;
let valueBuffer: any = {};

udpPort.on("ready", function () {
    console.log(`Listening for OSC over UDP on port ${UDP_PORT}.`);
    console.log(`Awaiting socket connection on port ${SOCKET_PORT}.`);

    io.on("connection", (socket: Socket) => {
        console.log("Socket connected!");

        udpPort.on("message", ({ address, args }: { address: string, args: any }) => {
            if (address === "/pitch") valueBuffer.pitch = args[0];
            if (address === "/velocity") valueBuffer.velocity = args[0];

            if (Object.keys(valueBuffer).length === requiredValuesForNote) {
                // Emit socket to (webGL) client
                io.emit("osc-message", valueBuffer);
                valueBuffer = {};
            }
        });
    });
});

udpPort.on("error", function (err: Error) {
    console.log(err);
});

udpPort.open();

app.use(express.static(path.join(__dirname, '..', 'public')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})

