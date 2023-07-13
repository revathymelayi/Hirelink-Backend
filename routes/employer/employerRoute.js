const express = require("express");
const employerRoute = express();
const jobController= require("../../controllers/employer/jobController");
const isEmployer = require("../../middlewares/isEmployer");
const logoUpload = require("../../config/multer").userImageUpload;





employerRoute.post('/add-job', isEmployer, logoUpload.single('logoImage'), jobController.addJob);
employerRoute.get('/jobs', isEmployer, jobController.jobs);
employerRoute.put('/delete-job', isEmployer, jobController.deleteJob);
employerRoute.post('/edit-job', isEmployer, jobController.editJob);



module.exports = employerRoute