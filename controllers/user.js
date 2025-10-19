import express from "express";

import User from "../db/models/user.js";
import CustomError from "../utils/customErrors.js";
import Device from "../db/models/device.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";

const app = express();
app.use(express.json());

// export const createUser = async (req, res, next) => {
//   let user = req.body;

//   const searchelm = await User.findOne({ email: req.body.email });

//   if (searchelm) {
//     res
//       .status(403)
//       .json("User with this email already exist!!, Kindly use another email");
//   } else {
//     try {
//       const newUser = await User.create(user);
//       console.log("data received", user);
//       await newUser.save();
//       res.status(201).json("User successfully created");
//     } catch (error) {
//       next(error);
//     }
//   }
  
// };

export const createUser = asyncErrorHandler(async (req, res, next) => {
    try {
        const newUser = await User.create(req.body);
        res.status(201).json({
            status: 'success',
            message: 'User successfully created',
            data: { user: newUser } // It's good practice to return the created entity
        });
    } catch (error) {
        // MongoDB's duplicate key error code is 11000
        if (error.code === 11000) {
            return next(new CustomError('User with this email already exists!', 409)); // 409 Conflict is more appropriate
        }
        // Pass other errors to the global error handler
        next(error);
    }
});

export const getUsers = async (req, res, next) => {
  console.log(req.user);

  try {
    User.find({}).populate('department').then((users) => {
      res.send(users);
    });
  } catch (error) {
    console.log(error);
  }
};

export const getSingleUser = async (req, res, next) => {
  try {
    console.log("received id", req.params.id);

    User.findById({ _id: req.params.id }).then((user) => {
      res.send(user);
    });
  } catch (error) {
    next(error)
    // return next(
    //   new CustomError("There was an error fetching this specific user", error.status)
    // );
  }
};

export const updateUser = async (req, res, next) => {
  try {
    User.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: req.body,
      }
      // Device.findByIdAndUpdate({})
    ).then(() => {
      res.status(200).json("User successfully Updated !!");
    });
  } catch (error) {
    res.send(error);
  }
};

export const deleteUser = async (req, res) => {
  try {
    User.findOneAndDelete({ _id: req.params.id }).then(() => {
      res.status(201).json("User successfully deleted");
    });
  } catch (error) {
    res.send(error);
  }
};

export const toggleRotationStatus = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new CustomError("User not found", 404));
    }

    // Toggle the boolean status
    user.isOnRotation = !user.isOnRotation;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        status: "success",
        message: `User ${user.name} rotation status updated to ${user.isOnRotation}.`,
        data: {
            isOnRotation: user.isOnRotation
        }
    });
});