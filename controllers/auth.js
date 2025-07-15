import express from "express";
import bodyParser from "body-parser";
// import mongoose from 'mongoose'
import { mongoose } from "../db/mongoose.js";
import Department from "../db/models/department.js";
import User from "../db/models/user.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import CustomError from "../utils/customErrors.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import util from "util";
import sendEmail from "../utils/email.js";
import crypto from "crypto";
import generateTokens from "../utils/generateTokens.js";
import { credentials } from "../utils/credentials.js";
import { broadcastUserStatus } from "../app.js";

const app = express();
dotenv.config();

app.use(express.json());

// const signToken = id =>{
//     return jwt.sign({id},process.env.SECRET_STR,{
//         expiresIn: process.env.LOGIN_EXPIRES
//     })
// }

// const generateAccessToken = ()=>{

// }

export const createSendRespond = (user, statusCode, res) => {};

export const signup = async (req, res, next) => {
  let user = req.body;

  try {
    const newUser = await User.create(user);
    console.log("data received", user);
    await newUser.save();

    // const { accessToken, refreshToken } = await generateTokens(user);
    res.status(201).json("User successfully created");

    //     const token = signToken(newUser._id)
    //    res.status(201).json({
    //      status: 'success',
    //      token,
    //      data:{
    //         user:newUser
    //      }
    //    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    // check if email & password is present in request.body
    if (!email || !password) {
      const error = new CustomError(
        "Please provide Email Id and password",
        400
      );
      return next(error);
    }

    // check if user exist with given email
    const user = await User.findOne({ email }).select("+password");

    // const isMatch = await user.comparePasswordsInDb(password,user.password)

    // check if user exist & password for that user is matching
    if (!user || !(await user.comparePasswordsInDb(password, user.password))) {
      const error = new CustomError("Incorrect email or password", 400);
      return next(error);
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    // const token = signToken(user._id)
    // console.log('token',user);
    const options = {
      // expires: process.env.LOGIN_EXPIRES,
      maxAge: 3 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      domaine: "http://localhost:3000",
    };
    const options2 = {
      // expires: process.env.LOGIN_EXPIRES,
      maxAge: 3 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      domaine: "http://localhost:5173",
    };

    // if(process.env.NODE_ENV === 'production'){
    //     options.secure = true
    // }

    // res.json(accessToken)

    let source = req.get("origin");
    let x;

    if (source == "http://localhost:5173") {
      x = "guest";
    } else if (source == "http://localhost:3000") {
      x = "main";
    } else if (source == undefined) {
      x = "postman";
    }

    if (
      (x == "guest" && (user.role == "guest" || user.role == "admin")) ||
      (x == "postman" &&
        (user.role == "guest" ||
          user.role == "admin" ||
          user.role == "user")) ||
      (x == "main" && (user.role == "admin" || user.role == "user"))
    ) {
      x == "main"
        ? res.cookie("jwt", refreshToken, options)
        : res.cookie("jwt", refreshToken, options2);

      await User.findOneAndUpdate(
        { _id: user._id },
        { $set: { status: "online" } }
      );

       broadcastUserStatus(user._id.toString(), "online");

      let user_updated_info = {};
      try {
          user_updated_info = await User.findById({ _id: user._id });
      } catch (error) {
          console.error("Error fetching user:", error);
      }

      res.status(200).json({
        error: false,
        accessToken,
        user: {
          id: user_updated_info._id,
          name: user_updated_info.name,
          email: user_updated_info.email,
          role: user_updated_info.role,
          department: user_updated_info.department,
        },
        message: "Logged in sucessfully",
      });
    } else {
      res.status(401).json({ message: "access not granted" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }

  // res.status(200).json({
  //     status: 'success',
  //     accessToken: token,

  // })
};

export const logout = async (req, res) => {
  // const cookies = req.cookies;
  const mail = req.body.data.email;

  try {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
    await User.findOneAndUpdate(
      { email: mail },
      { $set: { status: "offline" } }
    );
    const user = await User.findOne({ email: mail });
  if (user) {
    broadcastUserStatus(user._id.toString(), "offline");
  }
    res.json({ message: "cookie cleared" });
  } catch (error) {
    console.log("error", error);

    res.json({ message: "error while logout" });
  }

  // if(!cookies?.jwt) return res.sendStatus(204)
};

// export const getUsers = async(req,res) =>{
//     try {
//         User.find({}).then((users)=>{
//             res.send(users);
//         })
//     } catch (error) {
//         console.log(error)
//     }
// }

export const protect = asyncErrorHandler(async (req, res, next) => {
  // console.log("welcome to protect loop");

  // 1. check if token exist
  const testToken = req.headers.authorization || req.headers.Authorization;
  let token;

  if (testToken && testToken.startsWith("Bearer")) {
    token = testToken.split(" ")[1];
  }
  if (!token) {
    const error = new CustomError("You are not logged in", 401);
    next(error);
  }

  // 2.validate token

  const decodedToken = await util.promisify(jwt.verify)(
    token,
    process.env.SECRET_STR
  );

  // 3. check if exist in db
  const user = await User.findById(decodedToken._id || decodedToken.id);
  if (!user) {
    const error = new CustomError(
      "The user with the given token doesn't exist",
      401
    );
    next(error);
  }

  // 4. check if user changed his password
  const isPasswordChanged = await user?.isPasswordChanged(decodedToken.iat);
  if (isPasswordChanged) {
    const error = new CustomError(
      "The password has recently been changed,please login again",
      401
    );
    return next(error);
  }

  // 5. Allow user to access the route
  req.user = user;
  next();
});

// Authorization based on the role
export const restrict = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      const error = new CustomError(
        "You do not have permission to perform this action",
        403
      );
      next(error);
    }
    next();
  };
};

export const forgotPass = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    const error = new CustomError(
      "Uneable to find a user with the given email",
      404
    );
    next(error);
  }

  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`
  const resetUrl = `${req.protocol}://localhost:3000/resetpassword/${resetToken}`;

  const message = `we have received a password reset request. Please use the link below to reset your password\n\n${resetUrl}\n\nThis reset password link will be valid only for 10 minutes`;

  try {
    await sendEmail({
      email: user.email,
      subject: `password change request received`,
      message: message,
    });

    res.status(200).json({
      status: "success",
      message: "password reset link has been send to your email",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExp = undefined;
    user.save({ validateBeforeSave: false });

    return next(
      new CustomError("There was an error sending password reset email", 500)
    );
  }
});

export const forgotPassword = asyncErrorHandler(async (req, res, next) => {
  // 1. get user based on email received from DB
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    const error = new CustomError(
      "Uneable to find a user with the given email",
      404
    );
    next(error);
  }

  // 2. Generate a random reset token
  const resetToken = user.createResetPasswordToken();

  await user.save({ validateBeforeSave: false });
  // 3. Send the token back to the user email

  const resetUrl = `${req.protocol}://localhost:3000/api/v1/users/resetpassword/${resetToken}`;

  const message = `we have received a password reset request. Please use the link below to reset your password\n\n${resetUrl}\n\nThis reset password link will be valid only for 10 minutes`;

  try {
    await sendEmail({
      email: user.email,
      subject: `password change request received`,
      message: message,
    });

    res.status(200).json({
      status: "success",
      message: "password reset link has been send to your email",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExp = undefined;
    user.save({ validateBeforeSave: false });

    return next(
      new CustomError("There was an error sending password reset email", 500)
    );
  }
});

export const passwordResert = asyncErrorHandler(async (req, res, next) => {
  // check if a user exists with the given token and token hasn't expire
  const token = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetTokenExp: { $gt: Date.now() },
  });

  if (!user) {
    const error = new CustomError("Token is invalid or has expired", 400);
    next(error);
  }

  // updating the matched user's password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExp = undefined;
  user.passwordChangedAt = Date.now();

  user.save();

  // login the user
  // const loginToken = signToken(user._id)

  try {
    const { accessToken, refreshToken } = await generateTokens(user);

    const options = {
      // expires: process.env.LOGIN_EXPIRES,
      maxAge: 2 * 60 * 60 * 1000,
      httpOnly: true,
    };

    if (process.env.NODE_ENV === "production") {
      options.secure = true;
    }

    res.cookie("jwt", refreshToken, options);
    // res.json(accessToken)

    res.status(200).json({
      error: false,
      accessToken,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "Logged in sucessfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});

export const updatePassword = asyncErrorHandler(async (req, res, next) => {
  // get user from DB
  const user = await User.findById(req.user._id).select("+password");

  //   check if the supplied password is correct
  if (
    !(await user.comparePasswordsInDb(req.body.currentPassword, user.password))
  ) {
    return next(new CustomError("invalid password"), 401);
  }
  // if supplied pwd is current update password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  // login user & send jwt
  // const token = signToken(user._id)

  res.status(200).json({
    status: "success",
    // token,
    data: {
      user,
    },
    message: "Password updated successfully!!!",
  });
});
