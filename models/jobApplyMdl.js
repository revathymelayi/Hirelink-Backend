const mongoose = require("mongoose");
const Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
const jobapplySchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      required: true,
    },
    employerId: {
      type: ObjectId,
      required: true,
    },
    jobId: {
      type: ObjectId,
      required: true,
    },
    status: {
      type: Boolean,
      required: true,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("jobApply", jobapplySchema);
