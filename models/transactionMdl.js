const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
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
