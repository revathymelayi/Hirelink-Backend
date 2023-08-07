const Jobtype = require("../../models/jobtypeMdl");

//jobtypes//
const jobtypes = async (req, res) => {
  try {
    const jobtypes = await Jobtype.find({}).sort({createdAt:-1});
    if (jobtypes) {
      return res.status(200).json({ jobtypes });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//Add Jobtype//
const addJobtype = async (req, res) => {
  try {
    const { jobtype } = req.body
    if (!jobtype)
      return res.status(400).json({ message: "jobtype is required" });
      const checkJobtype = await Jobtype.findOne({ name: { $regex: `${ jobtype}.*`, $options: "i" } });
      if (checkJobtype)
        return res.status(400).json({ message: "Jobtype already exist!!!" });
    const newType = await Jobtype.updateOne({ name: jobtype }, { $set: { name: jobtype, status: true } }, { upsert: true })

    if (!newType)
      return res.status(400).json({ message: "Something went wrong" });
    return res.status(200).json({ message: "Jobtype added successfully !!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
//Edit Jobtype//
const updateJobtype = async (req, res) => {
  try {
    const { jobtypeId } = req.query
    const { jobtype } = req.body
    if (!jobtype)
      return res.status(400).json({ message: "Jobtype is required" });
    const updateJobtype = await Jobtype.findByIdAndUpdate(jobtypeId, { name: jobtype })

    if (!updateJobtype)
      return res.status(400).json({ message: "Something went wrong" });
    return res.status(200).json({ message: "Jobtype updated successfully !!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
//Change Jobtype status//
const changeStatus = async (req, res) => {
  try {
    const { jobtypeId } = req.query
    const jobtype = await Jobtype.findById(jobtypeId)
    const newStatus = !jobtype.status
    const updateStatus = await Jobtype.findByIdAndUpdate(jobtypeId,
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


module.exports = {
  jobtypes,
  addJobtype,
  updateJobtype,
  changeStatus
}