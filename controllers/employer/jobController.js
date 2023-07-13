const User = require("../../models/userMdl");
const Job = require("../../models/jobMdl");
const Types= require("../../models/jobtypeMdl");
const Category = require("../../models/categoryMdl");
const bcrypt = require("bcrypt");
require("dotenv").config();
const moment = require("moment");
const mongoose = require('mongoose');
const { USER_ROLE, EMPLOYER_ROLE, ADMIN_ROLE, PENDING_EMPLOYER } = require("../../utils/roles")
const ObjectId = mongoose.Types.ObjectId

const addJob = async(req,res)=>{
 
    try{
        const {  companyName,jobTitle, description,experience, location, salary,jobtype,category,skills } = req.body
        
        const {employerId}=req.query;
        const  logoImage=req.file;
        console.log(req.file)
        if (!employerId && !companyName && !jobTitle && !description && !experience && !location && !salary && !jobtype && !category && !skills && !logoImage)
        return res.status(400).json({ message: "All fields are required !!" });
    const newJob = Job({
        employerId,
        companyName,
        jobTitle,
        description,
        experience,
        location,
        salary,
        jobtype,
        category,
        skills,
        logoImage: logoImage.filename
    })
    const uploadJob = await newJob.save()
    if (!uploadJob)
        return res.status(400).json({ message: "Something went wrong" });
    return res.status(200).json({ message: "Job Uploaded", job: newJob });


    }catch(error){
        return res.status(400).json({ message: error.message });
    }
}


const jobs = async (req, res) => {
    try {
       
        const { userId } = req.query
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
        console.log(jobs)
       
        if (jobs) {
            return res.status(200).json({ jobs});
        }
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
const deleteJob = async (req, res) => {
    try {
        const { jobId } = req.query
        if (!jobId)
            return res.status(400).json({ message: "Invalid request" });
        const deleteJob = await Job.findByIdAndUpdate(jobId, { status: false })
        if (!deleteJob)
            return res.status(400).json({ message: "Job-post cant be deleted" });
        return res.status(200).json({ message: "Job-post deleted successfully" });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
const editJob = async (req, res) => {
    try {
        const {companyName,jobTitle, description,experience, location, salary,jobtype,category,skills } = req.body;
        const { jobId } = req.query;
        console.log(req.body);
        if (!jobId)
            return res.status(400).json({ message: "Invalid job-post" });
        const jobDetails = await Job.findById(jobId);
        let logoImage = jobDetails.logoImage
        

        if (req.files && req.files.logoImage) {
            logoImage = req.files.logoImage[0].filename
        }
       
        const updateResult = await Job.findByIdAndUpdate(jobId, {
            companyName,
            jobTitle,
            description,
            experience,
            location,
            salary,
            jobtype,
            category,
            skills,
            logoImage
        },{new:true});
        if (!updateResult)
            return res.status(400).json({ message: "Job not updated !!" });
        return res.status(200).json({ message: "Job updated successfully !!",job:updateResult });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}




module.exports={
    addJob,
    jobs,
    deleteJob,
    editJob
}