// import { Department } from '../db/models/department'
import express from "express";

// import mongoose from 'mongoose'
import { mongoose } from "../db/mongoose.js";
import Department from "../db/models/department.js";
import Calibration from "../db/models/calibration.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import Device from "../db/models/device.model.js";

const app = express();
app.use(express.json());

export const createCalibration = asyncErrorHandler(async (req, res, next) => {
  try {
    let calibrationInput = req.body;

    const deviceInfo = await Device.findOne({
      serial_number: calibrationInput.serial_number,
    });
    const depInfo = await Department.findOne({ name: calibrationInput.name });

    let newCalibration = new Calibration({
      device_name: deviceInfo.name,
      model: deviceInfo.model,
      serial_number: deviceInfo.serial_number,
      department: depInfo.name,
      calibration_made: calibrationInput.name,
      calibration_result: calibrationInput.result,
      calibration_date: calibrationInput.date,
      next_calibration_date: calibrationInput.next_calibration_date,
      calibrated_by: calibrationInput.calibrated_by,
      calibrator_phone_number: calibrationInput.calibrator_phone_number,
      notes: calibrationInput.notes,
    });

    await newCalibration.save().then((calibrationDoc) => {
      res.send(calibrationDoc);
    });
  } catch (error) {
    console.log("error", error);

    next(error);
  }
});

export const getCalibrations = asyncErrorHandler(async (req, res, next) => {
  try {
    Calibration.find({}).then((calibrations) => {
      res.send(calibrations);
    });
  } catch (error) {
    next(error);
  }
});

export const getSingleCalibration = asyncErrorHandler( async(req, res, next) => {
  try {
    Calibration.findById({ _id: req.params.id }).then((calib) => {
      res.send(calib);
    });
  } catch (error) {
    next(error);
  }
});

export const updateCalibration = asyncErrorHandler(async (req, res, next) => {
  try {
    Calibration.findOneAndUpdate(
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
});

export const deleteDepartment = asyncErrorHandler (async (req, res, next) => {
  try {
   Calibration.findOneAndDelete({ _id: req.params.id }).then((deletedelm) => {
      res.send(deletedelm);
    });
  } catch (error) {
    next(error)
  }
});
