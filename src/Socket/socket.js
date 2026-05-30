import { io } from "socket.io-client";


export const  socket = io("https://zync-backend-tive.onrender.com",{
    withCredentials:true,
    autoConnect:true
});

