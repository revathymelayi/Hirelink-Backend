const express = require("express");
const userRoute = express();
const userController = require("../../controllers/user/userController");
const resumeUpload = require("../../config/multer"). userResumeUpload;
const isUser = require("../../middlewares/isUser")

userRoute.get('/employers', userController.employers);
userRoute.post('/employer/search', userController.searchEmployer);
userRoute.post('/apply',userController.jobApply);
userRoute.post('/profile-complete',resumeUpload.single('resume'),userController.profileComplete);
userRoute.post('/job/search', userController.searchJob);

userRoute.post('/edit-user-details', isUser, resumeUpload.single('resume'), userController.editUser);
userRoute.get('/jobs',userController.jobs);
userRoute.get('/appliedjobs',userController.appliedJobs)

module.exports = userRoute