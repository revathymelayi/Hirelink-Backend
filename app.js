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




app.use("/api/auth",authRoute)
app.use("/api/admin",adminRoute)
app.use("/api/employer",employerRoute)
app.use("/api/user",userRoute)





//port
const PORT = process.env.PORT ||8080;

app.get("/",(req,res)=>{
    res.send("Backend is Running...")
})

//listener
app.listen(PORT , ()=>{console.log('Server is running on  http://localhost:8080')})
