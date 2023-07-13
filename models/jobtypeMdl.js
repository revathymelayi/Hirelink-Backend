const mongoose = require("mongoose");
const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

const jobTypeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        status: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("jobtypes", jobTypeSchema);