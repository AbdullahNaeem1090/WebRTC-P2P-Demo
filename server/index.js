// import { Server } from "socket.io";

// const io = new Server(4000, {
//   cors: true,
// });

// io.on("connection", (socket) => {
//   console.log(socket.id, "connected");


//   socket.on("room-join",(data)=>{
//      io.to(data.roomId).emit("user-joined",{id:socket.id})
//      socket.join(data.roomId)
//   })

//   socket.on("make-call",({to,offer})=>{
//     io.to(to).emit("incoming-call",{from:socket.id,offer})
//   })

//   socket.on("call-recieved",({to,answer})=>{
//     io.to(to).emit("call-accepted",{by:socket.id,answer})
//   })

//   socket.on("ice-candidate-exchange", ({ candidate }) => {
//  socket.broadcast.emit("ice-candidate", { candidate })
// });


// });

import { Server } from "socket.io";

const io = new Server(4000, {
  cors: true,
});

io.on("connection", (socket) => {
  console.log(socket.id, "connected");

  socket.on("room-join", (data) => {
    console.log(`${socket.id} joining room ${data.roomId}`);
    socket.join(data.roomId);
    // Notify others in the room that a new user joined
    socket.to(data.roomId).emit("user-joined", { id: socket.id });
  });

  socket.on("make-call", ({ to, offer }) => {
    console.log(`Call from ${socket.id} to ${to}`);
    io.to(to).emit("incoming-call", { from: socket.id, offer });
  });

  socket.on("call-recieved", ({ to, answer }) => {
    console.log(`Call answered by ${socket.id} to ${to}`);
    io.to(to).emit("call-accepted", { by: socket.id, answer });
  });

  socket.on("ice-candidate-exchange", ({ candidate }) => {
    console.log(`ICE candidate from ${socket.id}`);
    // Send to all other clients in the room, not just broadcast
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit("ice-candidate", { candidate });
      }
    });
  });

  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`);
  });
});
