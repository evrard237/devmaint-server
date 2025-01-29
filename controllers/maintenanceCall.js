// import { Department } from '../db/models/department'
import express, { response } from "express";

// import mongoose from 'mongoose'
import { mongoose } from "../db/mongoose.js";

import Device from "../db/models/device.model.js";
import User from "../db/models/user.js";
import MaintenanceCall from "../db/models/maintenanceCall.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";

const app = express();
app.use(express.json());

export const createMaintenanceCall = asyncErrorHandler(
  async (req, res, next) => {
    let maintenanceCallInput = req.body;

    let newMaintenanceCall = new MaintenanceCall({
      device_name: maintenanceCallInput.device_name,
      model: maintenanceCallInput.model,
      serial_number: maintenanceCallInput.serial_number,
      department: req.user.department,
      user_id: req.user._id,
      user_designation: req.user.designation,
      user_phone_number: req.user.phone_number,
      call_status: "pending",
      nature_of_problem: maintenanceCallInput.description,
      date: new Date(),
    });

    let exist = await MaintenanceCall.findOne({
      serial_number: maintenanceCallInput.serial_number,
    });

    if (exist) {
      res.status(400).json({ message: "Request already sent!!!" });
    } else {
      try {
        await newMaintenanceCall.save().then((maintenanceCallDoc) => {
          res.send(maintenanceCallDoc);
        });
        await Device.findOneAndUpdate(
          { serial_number: maintenanceCallInput.serial_number },
          { $set: { status: "Down" } }
        ).then((response) => {
          res.send(response);
        });
      } catch (error) {
        next(error);
      }
    }
  }
);



export const getListMaintenanceCall = asyncErrorHandler(
  async (req, res, next) => {
    try {
      // Fetch all maintenance calls
      const list = await MaintenanceCall.find({});

      // Use Promise.all to handle asynchronous operations for each item in the list
      const result = await Promise.all(
        list.map(async (listObj) => {
          // Fetch user details for each maintenance call
          const finalData = await User.findById({ _id: listObj.user_id });
          const deviceData = await Device.findOne({serial_number: listObj.serial_number})

          // Return the processed object
          return {
            device_name: deviceData.name,
            model: deviceData.model,
            serial_number: deviceData.serial_number,
            department: listObj.department,
            user_name: finalData.name,
            user_designation: finalData.designation,
            user_phone_number: finalData.phone_number,
            call_status: listObj.call_status, 
            nature_of_problem: listObj.nature_of_problem,
            date: listObj.date,
            createdAt: listObj.createdAt,
          };
        })
      );

      // Send the response once all data is processed
      res.status(200).json(result);
    } catch (error) {
      next(error); // Pass the error to the error-handling middleware
    }
  }
);

export const getMaintenanceCallsPerUser = asyncErrorHandler(
  async (req, res, next) => {
    try {
      MaintenanceCall.findById({ user_name: req.user.name }).then(
        (maintenanceCall) => {
          res.send(maintenanceCall);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

export const getSingleMaintenanceCall = async (req, res) => {
  try {
    MaintenanceCall.findById({ _id: req.params.id }).then((maintenanceCall) => {
      res.send(maintenanceCall);
    });
  } catch (error) {
    next(error);
  }
};

export const updateMaintenanceCall = asyncErrorHandler(
  async (req, res, next) => {
    try {
      await MaintenanceCall.findOneAndUpdate(
        { _id: req.params.id },
        {
          $set: req.body,
        }
      ).then(() => {
        res.sendStatus(200);
      });
    } catch (error) {
      next(error);
    }
  }
);

export const deleteMaintenanceCall = async (req, res) => {
  try {
    MaintenanceCall.findOneAndDelete({ _id: req.params.id }).then(
      (deletedelm) => {
        res.send(deletedelm);
      }
    );
  } catch (error) {
    console.log(error);
  }
};
