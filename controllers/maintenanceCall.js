// import { Department } from '../db/models/department'
import express from "express";

// import mongoose from 'mongoose'
import { mongoose } from "../db/mongoose.js";

import Device from "../db/models/device.model.js";
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
      user_name: req.user.name,
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
        );
      } catch (error) {
        next(error);
      }
    }
  }
);

export const getListMaintenanceCall = asyncErrorHandler(
  async (req, res, next) => {
    try {
      MaintenanceCall.find({}).then((list) => {
        res.send(list);
      });
    } catch (error) {
      next(error);
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

// export const deleteDepartment = async(req,res) =>{
//     try {
//         Department.findOneAndDelete({_id: req.params.id}).then((deletedelm) => {
//             res.send(deletedelm);
//         })
//     } catch (error){
//         console.log(error)
//     }
// }
