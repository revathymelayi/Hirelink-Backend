const User = require("../models/userMdl");
const Transaction = require("../models/transactionMdl");
const bcrypt= require("bcrypt")
const jwt=require("jsonwebtoken")
require("dotenv").config();

const nodemailer = require("nodemailer")
const { EMPLOYER_ROLE} = require("../utils/roles")

//Registration
const register = async (req, res) => {
    let { firstName, lastName, email, password,role } = req.body;
    try {
      if (firstName && lastName && email && password && role) {
        const isUser = await User.findOne({ email: email });
        if (isUser) {
          return res.status(400).json({ message: " Already registered,please Login !!" });
        } else {
          const otp = Math.floor(Math.random()*9000+1000);
          const newUser = User({
            firstName,
            lastName,
            email,
            role,
            password: await bcrypt.hash(password, 10),
            verificationCode:otp,
            isActive: true
          });
          const resUser = await newUser.save();
          if (resUser) {
            const message = `<p>Hey ${ resUser.firstName } ${ resUser.lastName },<br/> Please enter the following code on the page where you requested for an OTP.</p><br/><button type="button" class="mt-20 py-20 px-20 mr-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-gray-400 border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">${ otp }</button>`;

            const subject = "Email Verification"
  
            sendEmailVerification(resUser.firstName, resUser.lastName, email, message)
            return res
              .status(200)
              .json({ message: "Registered Successfully", user: resUser });
          }
        }
      } else {
        return res.status(400).json({ message: "All fields are required !!" });
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };

const profileComplete = async (req, res) => {
  try {
    const { userId, companyName, registrationNumber, websiteUrl, contactNumber, address, zip } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(400).json({ message: "User not found !!" });
    }

    // Update employer details within the user object
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          employerdetails: {
            companyName,
            registrationNumber,
            websiteUrl,
            contactNumber,
            address,
            zip,
            isActive: true,
          },
        },
      }
    );

    // Fetch the updated user object
    const updatedUser = await User.findOne({ _id: userId });

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = generateTokens(updatedUser);

    // Set the refresh token as a cookie
    setRefreshTokenCookie(res, refreshToken);

    // Return the response with updated user data and access token
    return res.status(200).json({ message: "User profile updated successfully !!", accessToken, user: updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const paymentUpdate = async (req, res) => {
  try {
    const { userId } = req.params;
    const { transactionId } = req.body;
    const user = await User.findById(userId)
    if (!userId)
      return res.status(400).json({ message: "User not found !!" });
    const userRoleUpdate = await User.findByIdAndUpdate(userId, {
      role: EMPLOYER_ROLE
    })
    const newTransaction = await Transaction({
      userId,
      role: EMPLOYER_ROLE,
      amount: 100.00,

    }).save()
    if (newTransaction) {
      return res
        .status(200)
        .json({ message: "Payment recieved", user: user });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}







  //Refresh-token
  const refresh = (req, res) => {
    const cookies = req.cookies;
    console.log(cookies.refreshToken);
    if (!cookies?.refreshToken) return res.status(401).json({ message: 'Unauthorized' });
  
    const refreshToken = cookies.refreshToken;
  
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Forbidden' });
  
      const foundUser = await User.findOne({ _id: decoded.userId }).exec();
  
      if (!foundUser) return res.status(401).json({ message: 'Unauthorized' });
  
      const { accessToken } = generateTokens(foundUser);
      // Set the refresh token as an HTTP-only cookie
      setRefreshTokenCookie(res, refreshToken);
      res.json({ accessToken });
    });
  };


  //Login
  const login = async (req, res) => {
    const { email, password } = req.body;
    try {
      if (email && password) {
        const user = await User.findOne({ email: email });
        if (user) {
          if (await bcrypt.compare(password, user.password)) {
            //Gererate Token
            const { accessToken, refreshToken } = generateTokens(user);
            setRefreshTokenCookie(res, refreshToken);
            if (user.role === 'ADMIN') {
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
      "UserInfo": {
        "userId": user._id,
        "roles": user.role
      }
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1d' }
  )

  const refreshToken = jwt.sign(
    { "userId": user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '1d' }
  )
  return { accessToken, refreshToken }
}

//forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (email) {
      const user = await User.findOne({ email: email })
      if (!user) {
        return res.status(400).json({ message: "User not Found" });
      }
      sendEmailVerification(user.firstName, user.lastName, email)
      return res.status(200).json({ message: "Email sent successfully !!" });

    } else {
      return res.status(400).json({ message: "Email is required" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}


//send email verification
const sendEmailVerification = async (firstname, lastname, email) => {
  return new Promise((resolve, reject) => {
    try {
      const emailTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: "cartzillabang@gmail.com",
          pass: "gjgjzkiivxujpzgl"
        }
      });

      const mailOptions = {
        from: 'cartzillabang@gmail.com',
        to: email,
        subject: 'Forgot Password',
        html: `<p>Hi ${ firstname } ${ lastname }, please click <a href=${ process.env.APP_URL }user/forgotPassword?email=${ email }>here</a> to create a new password.</p>`,
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
  console.log(657890);
  try {
    const { newPassword, confirmPassword, email } = req.body
    if (!newPassword || !confirmPassword || !email)
      return res.status(400).json({ message: "All fields are required" });
    if (newPassword === confirmPassword) {
      const hashPassword = await bcrypt.hash(newPassword, 10)
      const updatePassword = await User.updateOne({ email: email }, { $set: { newPassword: hashPassword } })
      res.status(200).json({ message: 'Password updated successfully !!!' })
    } else {
      res.status(400).json({ error: 'Password mismatch !!!' })
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}
const validateOtp = async (req, res) => {
  try {
    const { otp } = req.body
    const { userId } = req.query
    const user = await User.findById(userId)
    if (!user)
      return res.status(400).json({ message: "Invalid user" });
    if (!user.verificationCode || user.verificationCode !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
      
    await User.findByIdAndUpdate(userId, { verificationCode: null })
    return res.status(200).json({ message: 'Otp verified !!!' })
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

//set refresh token as cookie
const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}


//logout
const logout = (req, res) => {
  const cookies = req.cookies
  if (!cookies?.jwt) return res.sendStatus(204) //No content
  res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
  res.json({ message: 'Cookie cleared' })
}







  module.exports={
    register,
    refresh,
    login,
    profileComplete,
    paymentUpdate,
    forgotPassword,
    updatePassword,
    logout,
    validateOtp
  }
  