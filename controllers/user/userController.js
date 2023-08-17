const User = require("../../models/userMdl");
const JobApply = require("../../models/jobApplyMdl");
const Job= require("../../models/jobMdl");

const updateUserDetails =require("../../helpers/userAccount").updateUserDetails

const { EMPLOYER_ROLE } = require("../../utils/roles");
const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;


//employers
const employers = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId)
      return res.status(400).json({ message: "Something went wrong" });
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "Invalid user" });
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    let employersList = "";
    employersList = await User.aggregate([
      { $match: { isActive: true, role: EMPLOYER_ROLE } },
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "employerId",
          as: "jobs",
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);
    const totalEmployersCount = await User.find({ role: EMPLOYER_ROLE }).count()
    console.log(totalEmployersCount)
    console.log(employersList);
    return res.status(200).json({ employers: employersList,totalEmployersCount: totalEmployersCount });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//Apply Job

const jobApply = async (req, res) => {
  try {
    const { userId, employerId, jobId } = req.body;

    // Check if the required fields are provided
    if (!userId || !employerId || !jobId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the user exists and is active
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res
        .status(400)
        .json({ message: "Invalid user or user is not active" });
    }

    // Check if the user has already applied for the job
    const existingApplication = await JobApply.findOne({ userId, jobId });
    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "User has already applied for this job" });
    }

    // Create the job application
    const jobApplication = new JobApply({
      userId,
      employerId,
      jobId,
      status: true, // Set status to true as it indicates the user has applied for the job
      currentStatus:true,
    });

    // Save the job application to the database
    const savedJobApplication = await jobApplication.save();

    if (savedJobApplication) {
      return res.status(200).json({ message: "Job application successful!" });
    } else {
      return res
        .status(500)
        .json({ message: "Failed to save job application" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//Checking the job application status

const checkJobApplication=async(req,res)=>{
  try{
    const { userId, jobId } = req.body;
    if (!userId || !jobId) {
      return res.status(400).json({ message: "User ID and Job ID are required" });
    }
    const existingApplication = await JobApply.findOne({ userId, jobId });
    if (existingApplication) {
      return res.status(200).json({ applied: true });
    } else {
      return res.status(200).json({ applied: false });
    }

  }catch(error){
    return res.status(400).json({ message: error.message });
  }
}

//profile-complete

const profileComplete = async (req, res) => {
  try {
    const { userId, contactNumber, qualification, salary, experience, address,about,skills,company,jobRole } = req.body;
    const { resume } = req.file;
    console.log(req.file)
   
    if (contactNumber && salary && experience && address && qualification && about && skills && company && jobRole) {
      const resumeFile = req.file.filename;
    
      let user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.userdetails = {
        contactNumber,
        salary,
        experience,
        address,
        qualification,
        about,
        skills,
        company,
        jobRole,
        resume: resumeFile,
        isActive: true,
      };

      const updateProfileUpdate = await user.save();
      if (!updateProfileUpdate) {
        return res.status(400).json({ message: "Failed to update user profile!" });
      }
      
      return res.status(200).json({
        message: "User profile updated successfully !!",
        user: updateProfileUpdate,
      });
    } else {
      return res.status(400).json({ message: "All fields are required !!" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

//edit-user

const editUser = async (req, res) => {
 const userDetailsEdit = await updateUserDetails(req, res)
};

//search
const searchEmployer = async (req, res, next) => {
  try {
      const { search } = req.body;
      const showEmployer = await User.aggregate([
          {
              $match: {
                  isActive: true,
                  firstName: { $regex: `${ search }.*`, $options: "i" },
                
              },
          },
          {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "employerId",
          as: "jobs",
        },
      },

      ]);
      console.log("showEmployer:",showEmployer);
      return res.status(200).json({ showEmployer: showEmployer });
  } catch (error) {
      return res.status(400).json({ message: error.message });
  }
};

const jobs=async(req,res)=>{
  try{
    const { userId } = req.query;
    console.log(req.query)
    if (!userId)
      return res.status(400).json({ message: "Something went wrong" });
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "Invalid user" });
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    let jobsList=""
    jobsList=await Job.aggregate([
      {
          $lookup:{
              from:"categories",
              localField:"category",
              foreignField:"_id",
              as:"category",

          }
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
              from: "users",
              localField: "employerId",
              foreignField: "_id",
              as: "employer",
          },
      },
      {
        $project: {
          _id: 1,
          employerId: 1,
          jobTitle: 1,
          location:1,
          salary:1,
          experience:1,
          description:1,
          skills:1,
          // Other fields...
          category: { $arrayElemAt: ["$category.name", 0] }, 
          jobtype: { $arrayElemAt: ["$jobtype.name", 0] }, 
          employer: { $arrayElemAt: ["$employer.employerdetails", 0] },
          sortOrder: "$createdAt",
        },
      },
      { $sort: { sortOrder: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
     
  ]);
  const totalJobsCount = await Job.find({ }).count()
  console.log(jobsList);
  return res.status(200).json({ jobs: jobsList,totalJobsCount: totalJobsCount });
} catch (error) {
  return res.status(400).json({ message: error.message });
}
}



const searchJob = async (req, res, next) => {
  try {
    const { search } = req.body;

    const matchQuery = {
      status: true,
      $or: [
        { jobTitle: { $regex: `${search}.*`, $options: "i" } },
        { location: { $regex: `${search}.*`, $options: "i" } },
        { salary: { $regex: `${search}.*`, $options: "i" } },
     
      ],
    };

    const showJob = await Job.aggregate([
      {
        $match: matchQuery,
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
          from: "users", // Replace "users" with the actual name of the user collection
          localField: "employerId", // Replace "userId" with the field in the Job collection that references the user
          foreignField: "_id", // Replace "_id" with the field in the User collection that corresponds to the above localField
          as: "employerDetails",
        },
      },
      {
        $project: {
          jobTitle: 1,
          description: 1,
          skills: 1,
          jobtype: { $arrayElemAt: ["$jobtype.name", 0] },
          category: 1,
          experience: 1,
          location: 1,
          salary: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          employerDetails: { $arrayElemAt: ["$employerDetails", 0] }, // Get the first element of the employerDetails array
          companyName: { $first: "$employerDetails.employerdetails.companyName" },
          userBio: { $first: "$employerDetails.employerdetails.userBio" },
          logo: { $first: "$employerDetails.employerdetails.logo" },
          address: { $first: "$employerDetails.employerdetails.address" },
          city: { $first: "$employerDetails.employerdetails.city" },
        
        },
      },
      
      
    ]);

    console.log("showJob:", showJob);
    return res.status(200).json({ showJob: showJob });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};






const appliedJobs = async (req, res) => {
  try {
    const { userId } = req.query;

    const appliedJobs = await JobApply.find({ userId }).lean(); // Convert to plain JavaScript objects

    // Extract all unique employerIds and jobIds from the appliedJobs array
    const employerIds = [...new Set(appliedJobs.map(job => job.employerId))];
    const jobIds = [...new Set(appliedJobs.map(job => job.jobId))];

    // Fetch all employers with the matching employerIds
    const employers = await User.find({ _id: { $in: employerIds }, role: 'EMPLOYER' }).lean();

    // Create a map to access employer details by employerId
    const employerMap = employers.reduce((map, employer) => {
      map[employer._id.toString()] = employer.employerdetails;
      return map;
    }, {});

    // Fetch all jobs with the matching jobIds
    const jobs = await Job.find({ _id: { $in: jobIds } }).lean();

    // Create a map to access job details by jobId
    const jobMap = jobs.reduce((map, job) => {
      map[job._id.toString()] = job;
      return map;
    }, {});

    // Combine the appliedJobs array with employer and job details
    const appliedJobsWithDetails = appliedJobs.map(jobApply => ({
      ...jobApply,
      employer: employerMap[jobApply.employerId.toString()],
      job: jobMap[jobApply.jobId.toString()],
    }));

    // console.log("Your jobs:", appliedJobsWithDetails);
    return res.status(200).json({ appliedJobs: appliedJobsWithDetails });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};








 



module.exports = {
  employers,
  jobApply,
  profileComplete,
  editUser,
  searchEmployer,
  jobs,
  searchJob,
  appliedJobs,
  checkJobApplication
 


};
