const User = require("../../models/userMdl");
const JobApply =require("../../models/jobApplyMdl")
const JobPost =require("../../models/jobMdl")
const updateUserPassword =require("../../helpers/userAccount").updateUserPassword;
const updateEmployerDetails=require("../../helpers/userAccount").updateEmployerDetails;
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;


//Change Password
const changePassword = async (req, res) => {
  const updatePassword = await updateUserPassword(req, res);
};
//edit
const editEmployer = async (req, res) => {
  const employerDetailsEdit = await updateEmployerDetails(req, res)
};

//DashboardDetails

const dashboardDetails = async(req,res)=>{
  try{
    const {employerId} =req.query
    const totalJobPosts =await JobPost.find({employerId ,status:true}).count()
    const totalApplicants = await JobApply.aggregate([
      { $match: {status: true, employerId: new ObjectId(employerId) } }, 
      {
        $group: {
          _id: "$employerId",
          totalApplicants: { $sum: 1 }
        }
      }
     
    ])
    const totalApplicantsCount = totalApplicants.length > 0 ? totalApplicants[0].totalApplicants : 0;
     console.log("12:",totalJobPosts)
     console.log("13:",totalApplicants)

    return res.status(200).json({
      
      totalJobPosts,
      totalApplicants: totalApplicantsCount
     
  })

  }catch(error){
    return res.status(500).json({ message: error.message });
  }

}





module.exports = {
  changePassword,
  editEmployer,
  dashboardDetails
 
};
