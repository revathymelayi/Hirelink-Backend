const Job =require("../../models/jobMdl")
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
           
           
        ]);
        console.log(jobs)
        if (jobs) {
            return res.status(200).json({jobs });
        }
    }  catch (error) {
        return res.status(400).json({ message: error.message });
    }
}


module.exports={
    jobs
}