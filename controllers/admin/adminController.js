const User = require("../../models/userMdl");
const Job = require("../../models/jobMdl");
const JobApply = require("../../models/jobApplyMdl");
const Transaction=require("../../models/transactionMdl")



require("dotenv").config();
const moment = require("moment");
const { USER_ROLE, EMPLOYER_ROLE, ADMIN_ROLE, PENDING_EMPLOYER } = require("../../utils/roles")

const users = async (req, res) => {
    try {
      if (req.roles !== ADMIN_ROLE) {
        return res.status(400).json({ message: "Invalid user" });
      }
      const users = await User.find({ role: USER_ROLE }).sort({createdAt:-1});
      if (users) {
        return res.status(200).json({ users });
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };

  const employers = async (req, res) => {
    try {
      if (req.roles !== ADMIN_ROLE) {
        return res.status(400).json({ message: "Invalid user" });
      }
      const employers = await User.find({ role: { $in: [EMPLOYER_ROLE, PENDING_EMPLOYER] } }).sort({createdAt:-1});
      if (employers) {
        return res.status(200).json({ employers });
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };

  const changeStatus = async (req, res) => {
    try {
      const { userId } = req.params
      const user = await User.findById(userId)
      const newStatus = !user.isActive
      const updateStatus = await User.findByIdAndUpdate(userId,
        { isActive: newStatus, deletedAt: newStatus ? moment().format("YYYY-MM-DD") : null }
      );
      if (!updateStatus) {
        return res.status(400).json({ message: "Something went wrong" });
      }
      return res.status(200).json({ message: "Status changed successfully !!" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
 const dashboardDetails = async(req,res)=>{
  try{
    const totalUsers = await User.find({ role: USER_ROLE }).count()
    const totalCompanies = await User.find({ role: EMPLOYER_ROLE }).count()
    const totalJobPost=await Job.find({status:true}).count()
    const totalApplicant = await JobApply.find({status:true}).count()
    const pendingEmployers=await User.find({role:PENDING_EMPLOYER}).count()
    const totalAmount = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },

    ])
    const total = totalAmount.length > 0 ? totalAmount[0].totalAmount : 0;
    console.log("23:",totalAmount)
    return res.status(200).json({
     
      totalUsers,
      totalCompanies,
      totalJobPost,
      totalApplicant,
      total,
      pendingEmployers
      
    });

  }catch(error){

  }
 }


const revenue = async (req, res) => {
 
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  try {
    const revenueData = await Transaction.aggregate([
      {
        $lookup: {
          from: "users", // Name of the User collection in the database
          localField: "userId",
          foreignField: "_id",
          as: "employerDetails",
        },
      },
      {
        $unwind: {
          path: "$employerDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          employerName: {
            $concat: ["$employerDetails.firstName", " ", "$employerDetails.lastName"],
          },
          email: "$employerDetails.email",
          companyName: "$employerDetails.employerdetails.companyName",
          logo:"$employerDetails.employerdetails.logo",
          transactionDate: "$createdAt",
          websiteUrl:"$employerDetails.employerdetails.websiteUrl",
          amount:1
        },
      },
      {
        $sort: { transactionDate: -1 } // -1 indicates descending order, 1 indicates ascending
      },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    
    ]);
    const totalEmployersCount = await User.find({ role: EMPLOYER_ROLE }).count()
    console.log("revenueData:", revenueData);
    console.log(totalEmployersCount);

    return res.status(200).json({revenueData: revenueData,totalEmployersCount:totalEmployersCount});
  } catch (error) {
    return res.status(500).json({ message: "An error occurred while calculating revenue." });
  }
};




  module.exports = {
    users,
    employers,
    changeStatus,
    dashboardDetails,
    revenue
    
  }