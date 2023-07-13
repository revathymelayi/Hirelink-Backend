const express = require("express")
const authRoute = express();
const authController = require("../controllers/authController");


authRoute.post("/user/register",authController.register);
authRoute.post("/user/validate-otp", authController.validateOtp);
authRoute.post("/user/login", authController.login);
authRoute.post("/refresh", authController.refresh);
authRoute.post("/user/profile-complete",authController.profileComplete);
authRoute.post("/user/payment-update/:userId",authController.paymentUpdate);
authRoute.post("/forgot-password", authController.forgotPassword);
authRoute.post("/logout", authController.logout);
authRoute.post('/update/password', authController.updatePassword)






module.exports=authRoute;