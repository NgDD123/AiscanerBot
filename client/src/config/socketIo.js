const io = require("socket.io-client");

const  baseURL=process.env.NODE_ENV == 'production'? "https://freedombot.online":'http://localhost:8001';

const socket = io.connect(baseURL,{
    autoConnect: false
});


const joinRoom = (roomID) => {
    socket.emit("join_room", roomID);
};

module.exports={
    socket,
    joinRoom,
}