const mongoose = require("mongoose");
const Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    required: false,
    default: null,
  },
  deletedAt: {
    type: String,
    required: false,
    default: null,
  },
  verificationCode: {
    type: String,
    required: false,
    default: null,
  },
  
  role: {
    type: String,
    required: true,
    default: null,
  },
  employerdetails:{
   
    companyName:{type:String},
    registrationNumber:{type:String},
    websiteUrl:{type:String},
    contactNumber:{type:String},
    address:{type:String},
    zip:{type:String},
    isActive:{type:Boolean}


  }
   

  
},

 { timestamps: true }
);

module.exports = mongoose.model("users", userSchema);
