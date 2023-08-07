const User = require("../models/userMdl");
const bcrypt = require("bcrypt");
const moment = require("moment");

//Change Password
const updateUserPassword = async (req, res) => {
    const { newPassword, confirmPassword, currentPassword } = req.body;
    const { userId } = req.query;

    try {
        if (!newPassword || !confirmPassword || !currentPassword) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: "Invalid User" });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Current password doesn't match" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New password and confirm password do not match" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(userId, {
            password: hashedPassword,
            lastPasswordResetDate:moment().format("YYYY-MM-DD")
        });

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};





const updateEmployerDetails = async (req, res) => {
    try {
        const { email, companyName, registrationNumber, websiteUrl, address, country, city, state, zip, contactNumber, userBio } = req.body;
        const { userId } = req.query;
        const userDetails = await User.findById(userId);
        if (!userDetails) {
            return res.status(400).json({ message: "Invalid User" });
        }

        let logo = userDetails.employerdetails.logo;
        let coverPhoto = userDetails.employerdetails.coverPhoto;

        if (req.files && req.files.logo) {
            logo = req.files.logo[0].filename;
        }
        if (req.files && req.files.coverPhoto) {
            coverPhoto = req.files.coverPhoto[0].filename;
        }

        const updateResult = await User.findByIdAndUpdate(userId, {
            email,
            "employerdetails.companyName": companyName,
            "employerdetails.registrationNumber": registrationNumber,
            "employerdetails.websiteUrl": websiteUrl,
            "employerdetails.address": address,
            "employerdetails.country": country,
            "employerdetails.city": city,
            "employerdetails.state": state,
            "employerdetails.zip": zip,
            "employerdetails.contactNumber": contactNumber,
            "employerdetails.userBio": userBio,
            "employerdetails.logo": logo,
            "employerdetails.coverPhoto": coverPhoto,
        });

        console.log("updateResult:", updateResult);

        if (!updateResult) {
            return res.status(400).json({ message: "User not updated !!" });
        }

        const updatedUser = await User.findById(userId);
        return res.status(200).json({ user: updatedUser });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

const updateUserDetails = async(req,res)=>{
    try{
        const { email, firstName, lastName,  address,  contactNumber, qualification,salary,experience,company,jobRole,skills,about } = req.body;
        console.log("req.file:", req.file);
        const { userId } = req.query;
        const userDetails = await User.findById(userId);
        if (!userDetails) {
            return res.status(400).json({ message: "Invalid User" });
        }
        let resume = userDetails.userdetails.resume;
        console.log("gh:",resume)
        if (req.file && req.file.filename) {
            resume = req.file.filename;
           
        }
         
          const updateResult = await User.findByIdAndUpdate(userId, {
            email,
            firstName,
            lastName,
            "userdetails.address": address,
            "userdetails.qualification": qualification,
            "userdetails.contactNumber": contactNumber,
            "userdetails.salary": salary,
            "userdetails.experience": experience,
            "userdetails.about":about,
            "userdetails.skills":skills,
            "userdetails.company":company,
            "userdetails.jobRole":jobRole,
            "userdetails.resume": resume
        });
        console.log("updateResult:", updateResult);

        if (!updateResult) {
            return res.status(400).json({ message: "User not updated !!" });
        }

        const updatedUser = await User.findById(userId);
        return res.status(200).json({ user: updatedUser });


    }catch(error){
        return res.status(400).json({ message: error.message });
    }
}


module.exports = {
updateUserPassword,
updateEmployerDetails,
updateUserDetails,
}