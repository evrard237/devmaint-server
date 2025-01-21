import express from "express";

import User from "../db/models/user.js";
import CustomError from "../utils/customErrors.js";

const app = express();
app.use(express.json());

export const createUser = async (req, res, next) => {
  let user = req.body;

  const searchelm = await User.findOne({ email: req.body.email });

  if (searchelm) {
    res
      .status(403)
      .json("User with this email already exist!!, Kindly use another email");
  } else {
    try {
      const newUser = await User.create(user);
      console.log("data received", user);
      await newUser.save();
      res.status(201).json("User successfully created");
    } catch (error) {
      console.log("wahala");
      next(error);
    }
  }
  // try {
  //     if(!User.findOne({email: user.email})){
  //         const newUser = await User.create(user);
  //         console.log("data received",user);
  //         await newUser.save();
  //         res.status(201).json("User successfully created")
  //     }else{
  //         res.status(403).json("User with this email already exist!!, Kindly use another email")
  //     }

  // } catch (error) {
  //    next(error)
  // }
};

export const getUsers = async (req, res, next) => {
  console.log(req.user);

  try {
    User.find({}).then((users) => {
      res.send(users);
    });
  } catch (error) {
    console.log(error);
  }
};

export const getSingleUser = async (req, res, next) => {
  try {
    User.findById({ _id: req.params.id }).then((user) => {
      res.send(user);
    });
  } catch (error) {
    return next(
      new CustomError("There was an error fetching this specific user", 404)
    );
  }
};

export const updateUser = async (req, res, next) => {
  try {
    User.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: req.body,
      }
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
