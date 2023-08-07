const User = require("../../models/userMdl");
const Job = require("../../models/jobMdl");
const Types = require("../../models/jobtypeMdl");
const Category = require("../../models/categoryMdl");
const jobApply = require("../../models/jobApplyMdl");
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

    if (category) {
      const foundCategory = await Category.findById(category);
      if (!foundCategory || !foundCategory.status) {
        return res.status(400).json({ message: "Invalid Category!" });
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
      {
        $lookup: {
          from: "jobapplies",
          localField: "_id",
          foreignField: "jobId",
          as: "applicants",
        },
      },
      {
        $addFields: {
          numberOfApplicants: { $size: "$applicants" }, // Count the number of applicants for each job
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    console.log("jobs:", jobs);

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

    jobDetails.jobTitle = jobTitle;
    jobDetails.description = description;
    jobDetails.experience = experience;
    jobDetails.location = location;
    jobDetails.salary = salary;
    jobDetails.jobtype = jobtype;
    jobDetails.category = category;
    jobDetails.skills = skills;

    const updateJob = await jobDetails.save();

    return res.status(200).json({ message: "Job updated successfully !!", job: updateJob });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};





const applicants = async (req, res) => {
  try {
    const { jobId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const applicants = await jobApply.aggregate([
      { $match: { status: true, jobId: new ObjectId(jobId) } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "candidates",
        },
      },
      {
        $unwind: "$candidates",
      },
      {
        $replaceRoot: {
          newRoot: "$candidates",
        },
      },
      {
        $lookup: {
          from: "jobapplies",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$userId", "$$userId"] },
                jobId: new ObjectId(jobId), // Match the specific jobId
              },
            },
          ],
          as: "jobApplyDetails",
        },
      },
      {
        $addFields: {
          appliedDate: { $arrayElemAt: ["$jobApplyDetails.createdAt", 0] },
          appliedStatus: { $arrayElemAt: ["$jobApplyDetails.currentStatus", 0] },
          appliedId: { $toString: { $arrayElemAt: ["$jobApplyDetails._id", 0] } },
        },
      },
      {
        $sort: { appliedDate: -1 } // -1 indicates descending order, 1 indicates ascending
      },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    const countPipeline = [
      { $match: { status: true, jobId: new ObjectId(jobId) } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ];

    const countResult = await jobApply.aggregate(countPipeline);

    const totalApplicants = countResult.length > 0 ? countResult[0].count : 0;

    // Handle the response
    return res.status(200).json({ applicants: applicants, totalApplicants: totalApplicants });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const changeStatus = async (req, res) => {
  try {
     const { jobApplyId } =req.params
     console.log("123:",req.params)
     const applied= await jobApply.findById(jobApplyId)
     console.log("12:",applied)
     const newStatus=!applied.currentStatus
     const updateStatus = await jobApply.findByIdAndUpdate(jobApplyId,
      { currentStatus: newStatus }
    );
    if (!updateStatus) {
      return res.status(400).json({ message: "Something went wrong" });
    }
    return res.status(200).json({ message: "Status changed successfully !!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


const searchApplicants = async (req, res, next) => {
  try {
    const {search} = req.body.search;
    console.log("Received search term:", { search });

   
    const matchQuery = {
      isActive:true,
      $or: [
        { firstName:  { $regex: new RegExp(`^${search}$`, "i")} },
        { lastName: { $regex: new RegExp(`^${search}$`, "i")} },
       
     
      ],

      
    };
    
    console.log("Match query:", matchQuery); // L
    const showApplicant = await User.aggregate([
      {
        $match: matchQuery,
      },
    ]);

    console.log(1234);
    console.log("show:", showApplicant);

    return res.status(200).json({ showApplicant: showApplicant });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};












module.exports = {
  addJob,
  jobs,
  deleteJob,
  editJob,
  applicants,
  searchApplicants,
  changeStatus
};
