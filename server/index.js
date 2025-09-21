const http = require("http");
const socketIo = require("socket.io");
const app = require("./app.js");

const port =8001;

const server = http.createServer(app); // Create an HTTP server using Express app
const io = new socketIo.Server(server, {
  cors: {
    origin: "*",
  },
});
// Socket.io server logic
io.on("connection", (socket) => {
  // Listen for events from the client
  socket.on("join_room", (room) => {
  console.log("A client connected "+room); 
    socket.join(room); // Join the specified room
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(port,'0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});

exports.sendPaymentMadeMessage = async (roomID) => {
  console.log("user "+roomID," paid")
  io.to(roomID).emit("paymentMade","paymentMade");
};