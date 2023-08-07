const express = require("express");
const adminRoute = express();
const adminController = require("../../controllers/admin/adminController");
const categoryController = require("../../controllers/admin/categoryController");
const jobtypeController = require("../../controllers/admin/jobtypeController");
const jobsController = require("../../controllers/admin/jobsController")
const isAdmin = require("../../middlewares/isAdmin");
adminRoute.get("/users", isAdmin, adminController.users);
adminRoute.get("/employers", isAdmin, adminController.employers);
adminRoute.put(
  "/change-user-status/:userId",
  isAdmin,
  adminController.changeStatus
);
adminRoute.get("/categories", isAdmin, categoryController.categories)
adminRoute.post("/add-category", isAdmin, categoryController.addCategory)
adminRoute.post("/update-category", isAdmin, categoryController.updateCategory)
adminRoute.put("/category/change-status", isAdmin, categoryController.changeStatus)

adminRoute.get("/job-types", isAdmin, jobtypeController.jobtypes)
adminRoute.post("/add-jobtype", isAdmin, jobtypeController.addJobtype)
adminRoute.post("/update-jobtype", isAdmin, jobtypeController.updateJobtype)
adminRoute.put("/jobtype/change-status", isAdmin, jobtypeController.changeStatus)

adminRoute.get("/jobs", isAdmin, jobsController.jobs)
adminRoute.put("/job/change-status", isAdmin, jobsController.changeStatus)
adminRoute.get("/dashboard/details", isAdmin, adminController.dashboardDetails)
adminRoute.get("/transaction",isAdmin,adminController.revenue)


module.exports = adminRoute;
