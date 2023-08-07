const mongoose = require("mongoose");
const Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;
const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      required: false,
    },
    role: {
      type: String,
      required: false,
    },
    
    amount: {
        type: Number,
        required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("transactions", transactionSchema);
