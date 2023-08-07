const Job =require("../../models/jobMdl")
const JobApply=require("../../models/jobApplyMdl")
const mongoose= require('mongoose');

const ObjectId = mongoose.Types.ObjectId
const jobs=async(req,res)=>{
    try{
        const { userId } = req.query
        const jobs=await Job.aggregate([
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
           
           
        ]);
        console.log(jobs)
        if (jobs) {
            return res.status(200).json({jobs });
        }
    }  catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

const changeStatus = async (req, res) => {
    try {
        const { jobId } = req.query
        const job = await Job.findById(jobId)
        const newStatus = !job.status
        const updateStatus = await Job.findByIdAndUpdate(jobId,
            { status: newStatus }
        );
        if (!updateStatus) {
            return res.status(400).json({ message: "Something went wrong" });
        }
        return res.status(200).json({ message: "Status changed successfully !!" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};




module.exports={
    jobs,
    changeStatus
}