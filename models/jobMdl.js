const mongoose = require("mongoose");
const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

const jobSchema = new Schema(
  {
    employerId: {
      type: ObjectId,
      required: true,
    },
    companyName:{
      type:String,
      required:true,

    },
    jobTitle: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    skills:{
      type:String,
      required:true,
    },
    jobtype: {
      type: ObjectId,
      required: true,
    },
    category:{
      type: ObjectId,
      required: true,

    },
    experience: {
      type: String,
      required: true,
    },
    location:{
        type: String,
        required: true,
    },
    salary: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      required: true,
      default: true,
    },
    logoImage: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("jobs", jobSchema);
