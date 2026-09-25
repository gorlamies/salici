import { io } from "socket.io-client";

export const socket = io("http://localhost:3000", { autoConnect: false }); // single connection for the whole app
