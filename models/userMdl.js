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
  lastPasswordResetDate: {
    type: String,
    required: false,
    default: null,
  },
  employerdetails:{
   
    companyName:{type:String},
    userBio:{type:String},
    logo:{type:String},
    coverPhoto:{type:String},
    registrationNumber:{type:String},
    websiteUrl:{type:String},
    contactNumber:{type:String},
    address:{type:String},
    country:{type:String},
    city:{type:String},
    state:{type:String},
    zip:{type:String},
    isActive:{type:Boolean}


  },
  userdetails:{
   
    qualification:{type:String},
    resume:{type:String},
    contactNumber:{type:String},
    salary:{type:String},
    experience:{type:String},
    address:{type:String},
    about:{type:String},
    skills:{type:String},
    company:{type:String},
    jobRole:{type:String},
    isActive:{type:Boolean}
  

  },

 
   

  
},

 { timestamps: true }
);

module.exports = mongoose.model("users", userSchema);
