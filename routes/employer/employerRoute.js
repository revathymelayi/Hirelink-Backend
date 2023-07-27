const express = require("express");
const employerRoute = express();
const jobController= require("../../controllers/employer/jobController");
const isEmployer = require("../../middlewares/isEmployer");
const employerController = require("../../controllers/employer/employerController")
const userImageUpload = require("../../config/multer").userImageUpload;
const userUpload = userImageUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
]);






employerRoute.post('/add-job', isEmployer, jobController.addJob);
employerRoute.get('/jobs', isEmployer, jobController.jobs);
employerRoute.put('/delete-job', isEmployer, jobController.deleteJob);
employerRoute.put('/edit-job', isEmployer, jobController.editJob);


employerRoute.post('/change/password', isEmployer, employerController.changePassword);
employerRoute.post('/edit-employer-details', isEmployer, userUpload, employerController.editEmployer);
employerRoute.get('/candidates',isEmployer,employerController.candidates)



module.exports = employerRoute