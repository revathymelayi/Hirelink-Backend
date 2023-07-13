require('dotenv').config()

const connectDb = ()=>{
    const mongoose = require("mongoose")
    mongoose.set('strictQuery',false)
    mongoose.connect(process.env.DB_URL+process.env.DB_NAME)
    .then(()=>{
        console.log("connected successfully")
    }) 
    .catch((error)=>{
        console.error("connection error:",error)
    })
    
}


module.exports = {
    connectDb
}