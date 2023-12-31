const User = require("../models/userMdl");
const Transaction = require("../models/transactionMdl");
const Job= require("../models/jobMdl");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const nodemailer = require("nodemailer");
const { EMPLOYER_ROLE } = require("../utils/roles");

//Registration

const register = async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword, role } =
    req.body;
  try {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !role
    ) {
      return res.status(400).json({ message: "All fields are required!!" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match!" });
    }

    const isUser = await User.findOne({ email: email });
    if (isUser) {
      return res
        .status(400)
        .json({ message: "Already registered, please Login!" });
    } else {
      const otp = Math.floor(Math.random() * 9000 + 1000);
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = User({
        firstName,
        lastName,
        email,
        role,
        password: hashedPassword,
        verificationCode: otp,
        isActive: true,
      });
      const resUser = await newUser.save();
      if (resUser) {
        const message = `<p>Hey ${resUser.firstName} ${resUser.lastName},<br/> Please enter the following code on the page where you requested for an OTP.</p><br/><button type="button" class="mt-20 py-20 px-20 mr-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-gray-400 border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">${otp}</button>`;

        const subject = "Email Verification";

        sendEmailVerification(
          resUser.firstName,
          resUser.lastName,
          email,
          message
        );
        return res
          .status(200)
          .json({ message: "Registered Successfully", user: resUser });
      }
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const profileComplete = async (req, res) => {
  try {
    const {
      userId,
      companyName,
      registrationNumber,
      websiteUrl,
      contactNumber,
      address,
      zip,
      userBio,
      country,
      city,
      state,
    } = req.body;
    const { logo, coverPhoto } = req.files;

    if (
      logo &&
      coverPhoto &&
      userBio &&
      companyName &&
      registrationNumber &&
      websiteUrl &&
      contactNumber &&
      address &&
      zip &&
      userBio &&
      country &&
      city &&
      state
    ) {
      const logoImage = logo[0].filename;
      const coverImage = coverPhoto[0].filename;

      if (!userId) {
        return res.status(400).json({ message: "Invalid user" });
      }

      const user = await User.findOne({ _id: userId });

      // Update employerdetails field separately
      user.employerdetails = {
        companyName,
        registrationNumber,
        websiteUrl,
        contactNumber,
        address,
        zip,
        userBio,
        country,
        city,
        state,
        logo: logoImage,
        coverPhoto: coverImage,
        isActive: true,
      };

      const updateProfileUpdate = await user.save();
      console.log(updateProfileUpdate);
      if (!updateProfileUpdate) {
        return res.status(400).json({ message: "User not found !!" });
      }

      // Access Token
      const { accessToken, refreshToken } = generateTokens(user);
      setRefreshTokenCookie(res, refreshToken);

      // Send accessToken containing username and roles
      return res.status(200).json({
        message: "User profile updated successfully !!",
        accessToken,
        user: updateProfileUpdate,
      });
    } else {
      return res.status(400).json({ message: "All fields are required !!" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const paymentUpdate = async (req, res) => {
  try {
    const { userId } = req.params;
    const { transactionId } = req.body;
    console.log(req.params);
    console.log(req.body);
    const user = await User.findById(userId);
    if (!userId) return res.status(400).json({ message: "User not found !!" });
    const userRoleUpdate = await User.findByIdAndUpdate(userId, {
      role: EMPLOYER_ROLE,
    });

    const newTransaction = await Transaction({
      userId,
      role: EMPLOYER_ROLE,
      amount: 100.0,
    }).save();
    if (newTransaction) {
      return res.status(200).json({ message: "Payment recieved", user: user });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//Refresh-token
const refresh = (req, res) => {
  const cookies = req.cookies;
  console.log(cookies.refreshToken);
  if (!cookies?.refreshToken)
    return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.refreshToken;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({ _id: decoded.userId }).exec();

      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      const { accessToken } = generateTokens(foundUser);
      // Set the refresh token as an HTTP-only cookie
      setRefreshTokenCookie(res, refreshToken);
      res.json({ accessToken });
    }
  );
};

//Login
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (email && password) {
      const user = await User.findOne({ email: email });
      if (user) {
        if (user.isActive === false) {
          return res.status(400).json({ message: "User is blocked" });
        }
        if (await bcrypt.compare(password, user.password)) {
          //Gererate Token
          const { accessToken, refreshToken } = generateTokens(user);
          setRefreshTokenCookie(res, refreshToken);
          if (user.role === "ADMIN") {
            return res
              .status(200)
              .json({ message: "Login Successfully", accessToken, user: user });
          } else {
            return res
              .status(200)
              .json({ message: "Login Successfully", accessToken, user: user });
          }
        } else {
          return res.status(400).json({ message: "Invalid Credentials" });
        }
      } else {
        return res.status(400).json({ message: "User not Registered" });
      }
    } else {
      return res.status(400).json({ message: "All fields are required !!" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//Token generation
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      UserInfo: {
        userId: user._id,
        roles: user.role,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
  return { accessToken, refreshToken };
};

//forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (email) {
      const user = await User.findOne({ email: email });
      if (!user) {
        return res.status(400).json({ message: "User not Found" });
      }
      const subject = "Forgot Password";
      const message = `<p>Hi ${user.firstName} ${user.lastName}, please click <a href=${process.env.APP_URL}updatePassword?email=${email}>here</a> to create a new password.</p>`;
      sendEmailVerification(
        user.firstName,
        user.lastName,
        email,
        message,
        subject
      );
      return res.status(200).json({ message: "Email sent successfully !!" });
    } else {
      return res.status(400).json({ message: "Email is required" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//send email verification
const sendEmailVerification = async (
  firstname,
  lastname,
  email,
  message,
  subject
) => {
  return new Promise((resolve, reject) => {
    try {
      const emailTransporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        auth: {
          user: "cartzillabang@gmail.com",
          pass: "gjgjzkiivxujpzgl",
        },
      });

      const mailOptions = {
        from: "cartzillabang@gmail.com",
        to: email,
        subject: subject,
        html: message,
      };

      emailTransporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          reject("Failed to send email");
        } else {
          resolve("Email sent successfully");
        }
      });
    } catch (error) {
      console.error(error);
      reject("Failed to send email");
    }
  });
};
//update password

const updatePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword, email } = req.body;
    if (!newPassword || !confirmPassword || !email)
      return res.status(400).json({ message: "All fields are required" });
    if (newPassword === confirmPassword) {
      const hashPassword = await bcrypt.hash(newPassword, 10);
      const updatePassword = await User.updateOne(
        { email: email },
        { $set: { password: hashPassword } }
      );
      res.status(200).json({ message: "Password updated successfully !!!" });
    } else {
      res.status(400).json({ error: "Password mismatch !!!" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const validateOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const { userId } = req.query;
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "Invalid user" });
    if (!user.verificationCode || user.verificationCode !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    await User.findByIdAndUpdate(userId, { verificationCode: null });
    return res.status(200).json({ message: "Otp verified !!!" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//set refresh token as cookie
const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "None",
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

//employers
const employers = async (req, res) => {
  try {
    let employersList = "";
    employersList = await User.aggregate([
      { $match: { isActive: true, role: EMPLOYER_ROLE } },
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "employerId",
          as: "jobs",
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    return res.status(200).json({ employers: employersList });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const jobs = async (req, res) => {
  try {
    let jobsList = "";
    jobsList = await Job.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "jobtypes",
          localField: "jobtype",
          foreignField: "_id",
          as: "jobtype",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "employerId",
          foreignField: "_id",
          as: "employer",
        },
      },
      {
        $project: {
          _id: 1,
          employerId: 1,
          jobTitle: 1,
          location:1,
          salary:1,
          experience:1,
          description:1,
          skills:1,
          // Other fields...
          category: { $arrayElemAt: ["$category.name", 0] }, // Assuming the category.name holds the category name.
          jobtype: { $arrayElemAt: ["$jobtype.name", 0] }, // Assuming the jobtype.name holds the jobtype name.
          employer: { $arrayElemAt: ["$employer.employerdetails", 0] }, // Assuming the employer.name holds the employer name.
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    return res.status(200).json({ jobs: jobsList});
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//logout
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ message: "Cookie cleared" });
};

module.exports = {
  register,
  refresh,
  login,
  profileComplete,
  paymentUpdate,
  forgotPassword,
  updatePassword,
  logout,
  validateOtp,
  employers,
  jobs
};
