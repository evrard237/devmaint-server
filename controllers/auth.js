import User from "../db/models/user.js";
import jwt from "jsonwebtoken";
import CustomError from "../utils/customErrors.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import util from "util";
import sendEmail from "../utils/email.js";
import crypto from "crypto";
import generateTokens from "../utils/generateTokens.js";
import { broadcastUserStatus } from "../app.js";

export const signup = async (req, res, next) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json("User successfully created");
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new CustomError("Please provide Email and password", 400));
    }
    const user = await User.findOne({ email }).select("+password").populate('department');
    if (!user || !(await user.comparePasswordsInDb(password, user.password))) {
      return next(new CustomError("Incorrect email or password", 400));
    }
    const { accessToken, refreshToken } = await generateTokens(user);
    const options = { maxAge: 3 * 60 * 60 * 1000, httpOnly: true, sameSite: "lax" };
    const options2 = { maxAge: 3 * 60 * 60 * 1000, httpOnly: true, sameSite: "lax" };
    const source = req.get("origin");
    let x;
    if (source == "http://localhost:5173") x = "guest";
    else if (source == "http://localhost:3000") x = "main";
    else if (source == undefined) x = "postman";

    if (
      (x == "guest" && (user.role == "guest" || user.role == "admin")) ||
      (x == "postman" && (user.role == "guest" || user.role == "admin" || user.role == "user" || user.role === "technician")) ||
      (x == "main" && (user.role == "admin" || user.role == "user" || user.role === "technician"))
    ) {
      x == "main" ? res.cookie("jwt", refreshToken, options) : res.cookie("jwt", refreshToken, options2);
      await User.findByIdAndUpdate(user._id, { $set: { status: "online" } });
      broadcastUserStatus(user._id.toString(), "online");
      res.status(200).json({
        error: false,
        accessToken,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department },
        message: "Logged in successfully",
      });
    } else {
      res.status(401).json({ message: "Access not granted" });
    }
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  try {
    const mail = req.body.data.email;
    const user = await User.findOneAndUpdate({ email: mail }, { $set: { status: "offline" } });
    if (user) {
      broadcastUserStatus(user._id.toString(), "offline");
    }
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
    res.json({ message: "cookie cleared" });
  } catch (error) {
    res.json({ message: "error while logout" });
  }
};

export const protect = asyncErrorHandler(async (req, res, next) => {
  let token;
  const testToken = req.headers.authorization || req.headers.Authorization;
  if (testToken && testToken.startsWith("Bearer")) {
    token = testToken.split(" ")[1];
  }
  if (!token) {
    return next(new CustomError("You are not logged in", 401));
  }
  const decodedToken = await util.promisify(jwt.verify)(token, process.env.SECRET_STR);
  const user = await User.findById(decodedToken._id || decodedToken.id);
  if (!user) {
    return next(new CustomError("The user with the given token doesn't exist", 401));
  }
  const isPasswordChanged = user.isPasswordChanged && await user.isPasswordChanged(decodedToken.iat);
  if (isPasswordChanged) {
    return next(new CustomError("The password has recently been changed, please login again", 401));
  }
  req.user = user;
  next();
});

export const restrict = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return next(new CustomError("You do not have permission to perform this action", 403));
    }
    next();
  };
};

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
