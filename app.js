//import modules
const express = require("express");
const mongoose = require('mongoose');
const morgan = require("morgan");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const path = require("path");


//app
const app=express();
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")))

//db
require("./config/database").connectDb();

//middleware
app.use(morgan("dev"));
app.use(cors({origin:true,credentials:true}))


//routes
const authRoute = require("./routes/authRoutes")
const adminRoute = require("./routes/admin/adminRoutes");
const employerRoute=require("./routes/employer/employerRoute")
const userRoute=require("./routes/user/userRoutes")
const chatRoute = require("./routes/chats/chatRoute");

const server = app.listen(3000, () => {
    console.log(`Server is running on port 3000.`);
  });

const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
      origin: "http://localhost:3000"
    }
}) 

io.on("connection", (socket) => {
    console.log("connected to socket.io");
  
    socket.on("setup", (user) => {
      socket.join(user);
      console.log('user setupped');
      socket.emit('connected');
    });
  
    socket.on("join chat", (room) => {
      socket.join(room);
      console.log("user joined in room " + room);
    })
  
    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
  
    socket.on('new message', (newMessageRecieved) => {
      console.log(newMessageRecieved);
      let chat = newMessageRecieved.chat;
      if (!chat.users) return console.log("no users");
      chat.users.forEach(user => {
        if (user._id == newMessageRecieved.sender._id)
          console.log("message received");
        return socket.in(user._id).emit("message recieved", newMessageRecieved);
      });
    })
  
    socket.off("setup", () => {
      console.log("User disconned");
      socket.leave(user._id);
    })
  })


  





app.use("/api/auth",authRoute)
app.use("/api/admin",adminRoute)
app.use("/api/employer",employerRoute)
app.use("/api/user",userRoute)
app.use("/api/chats", chatRoute)





//port
const PORT = process.env.PORT ||8080;

app.get("/",(req,res)=>{
    res.send("Backend is Running...")
})

//listener
// app.listen(PORT , ()=>{console.log('Server is running on  http://localhost:8080')})
