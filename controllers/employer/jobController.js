const User = require("../../models/userMdl");
const Job = require("../../models/jobMdl");
const Types = require("../../models/jobtypeMdl");
const Category = require("../../models/categoryMdl");
const bcrypt = require("bcrypt");
require("dotenv").config();
const moment = require("moment");
const mongoose = require("mongoose");
const {
  USER_ROLE,
  EMPLOYER_ROLE,
  ADMIN_ROLE,
  PENDING_EMPLOYER,
} = require("../../utils/roles");
const ObjectId = mongoose.Types.ObjectId;
//Add Job
const addJob = async (req, res) => {
  try {
    const {
      jobTitle,
      description,
      experience,
      location,
      salary,
      jobtype,
      category,
      skills,
    } = req.body;
   
    const { employerId } = req.query;

    // Check if all the required fields are present
    if (
      !jobTitle ||
      !description ||
      !experience ||
      !location ||
      !salary ||
      !jobtype ||
      !category ||
      !skills
    ) {
      return res.status(400).json({ message: "All fields are required!" });
    }

  
    if (jobtype) {
        const foundJobType = await Types.findById(jobtype);
        if (!foundJobType || !foundJobType.status) {
          return res.status(400).json({ message: "Invalid jobtype!" });
        }
      }

    if(category){
        const foundCategory = await Category.findById(category);
        if(!foundCategory || !foundCategory.status){
            return res.status(400).json({message:"Invalid Category!"})
        }
    }

    const newJob = Job({
      employerId,
      jobTitle,
      description,
      experience,
      location,
      salary,
      jobtype,
      category,
      skills,
    });

    const uploadJob = await newJob.save();

    if (!uploadJob)
      return res.status(400).json({ message: "Something went wrong" });

    return res.status(200).json({ message: "Job Uploaded", job: newJob });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const jobs = async (req, res) => {
  try {
    const { userId } = req.query;
    const jobs = await Job.aggregate([
      { $match: { status: true, employerId: new ObjectId(userId) } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "jobtypes",
          localField: "jobtype",
          foreignField: "_id",
          as: "jobtype",
        },
      },
    ]);
    console.log(jobs);

    if (jobs) {
      return res.status(200).json({ jobs });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.query;
    if (!jobId) return res.status(400).json({ message: "Invalid request" });
    const deleteJob = await Job.findByIdAndUpdate(jobId, { status: false });
    if (!deleteJob)
      return res.status(400).json({ message: "Job-post cant be deleted" });
    return res.status(200).json({ message: "Job-post deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
// const editJob = async (req, res) => {
//   try {
//     const {
//       jobTitle,
//       description,
//       experience,
//       location,
//       salary,
//       jobtype,
//       category,
//       skills,
//     } = req.body;
//     const { jobId } = req.query;
//     console.log("body:",req.body);
//     if (!jobId) return res.status(400).json({ message: "Invalid job-post" });
//     const jobDetails = await Job.findById(jobId);
//     if (!jobDetails) {
//       return res.status(400).json({ message: "Invalid job" });
//   }

//     const updateResult = await Job.findByIdAndUpdate(
//       jobId,
//       {
//         "job.jobTitle": jobTitle,
//         "job.description":description,
//         "job.experience":experience,
//         "job.location":location,
//         "job.salary":salary,
//         "job.jobtype":jobtype,
//         "job.category":category,
//         "job.skills":skills,
//       },
//       { new: true }
//     );
//     console.log("updateResult:",updateResult)
//     if (!updateResult){
//       return res.status(400).json({ message: "Job not updated !!" });
//     }
//     const updatedJob = await Job.findById(jobId);
//     return res.status(200).json({ job: updatedJob}); 
 
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };

const editJob = async (req, res) => {
  try {
    const {
      jobTitle,
      description,
      experience,
      location,
      salary,
      jobtype,
      category,
      skills,
    } = req.body;
    const { jobId } = req.query;
   
    console.log("Received request with body:", req.body);
    console.log("jobtype in the payload:", req.body.jobtype);
    console.log("category in the payload:", req.body.category);

    if (!jobId) return res.status(400).json({ message: "Invalid job-post" });

    const jobDetails = await Job.findById(jobId);
    if (!jobDetails) {
      return res.status(400).json({ message: "Invalid job" });
    }

    const updateResult = await Job.findByIdAndUpdate(
      jobId,
      {
        $set:{
          "job.jobTitle":jobTitle,
          "job.description": description,
          "job.experience": experience,
          "job.location": location,
          "job.salary": salary,
          "job.jobtype":jobtype,
          "job.category": category,
          "job.skills": skills,
        }
       
      },
      { new: true }
    );
     console.log("updateResult:", updateResult);

    if (!updateResult) {
      return res.status(400).json({ message: "Job not updated !!" });
    }

    const updatedJob = await Job.findById(jobId);
     console.log("Updated job details:", updatedJob);

    return res.status(200).json({ job: updatedJob });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};








module.exports = {
  addJob,
  jobs,
  deleteJob,
  editJob,
};
