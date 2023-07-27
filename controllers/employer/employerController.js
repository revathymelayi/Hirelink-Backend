const User = require("../../models/userMdl");
const JobApply =require("../../models/jobApplyMdl")
const updateUserPassword =require("../../helpers/userAccount").updateUserPassword;
const updateEmployerDetails=require("../../helpers/userAccount").updateEmployerDetails;
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;


//Change Password
const changePassword = async (req, res) => {
  const updatePassword = await updateUserPassword(req, res);
};
const editEmployer = async (req, res) => {
  const employerDetailsEdit = await updateEmployerDetails(req, res)
};


const candidates = async (req, res) => {
  try {
    const data = await JobApply.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "employerId",
          foreignField: "_id",
          as: "companies",
        },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "jobs",
        },
      },
      { $unwind: "$jobs" },
      { $match: { "jobs.status": true } },
      { $sort: { _id: 1 } },
    ]);
     console.log("data:",data)
    // Check if any data is returned
    if (data && data.length > 0) {
      // Data is present, send it in the response
      res.status(200).json({
        error: false,
        message: "Successfully completed",
        data: data,
      });
    } else {
      // Data is empty
      res.status(404).json({
        error: true,
        message: "No data found",
        data: [],
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: true,
      message: "Something went wrong",
      data: [],
    });
  }
};
// const candidates = async (req, res) => {
//   try {
//     const {userId} = req.query

//     if (!employerId) {
//       return res.status(400).json({ error: true, message: "employerId parameter is missing" });
//     }

//     const data = await JobApply.aggregate([
//       {
//         $match: { userId: userId, status: true },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "userId",
//           foreignField: "_id",
//           as: "userDetails",
//         },
//       },
//     ]);
//     console.log("data:",data);

//     res.status(200).json({
//       error: false,
//       message: "Candidates for the employer's jobs",
//       data,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       error: true,
//       message: "Something went wrong",
//       data: [],
//     });
//   }
// };





module.exports = {
  changePassword,
  editEmployer,
  candidates
};
