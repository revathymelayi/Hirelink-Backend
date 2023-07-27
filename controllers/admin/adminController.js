const User = require("../../models/userMdl");



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
  // const types = async (req, res) => {
  //   try {
  //     const types = await Level.find({status:true})
  //     return res.status(200).json({ levels:levels });
  //   } catch (error) {
  //     return res.status(500).json({ message: error.message });
  //   }
  // }
  

  module.exports = {
    users,
    employers,
    changeStatus,
    
  }