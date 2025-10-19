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
    const {
      device,
      calibration_made,
      calibration_result,
      calibration_date,
      next_calibration_date,
      calibrated_by,
      calibrator_phone_number,
      notes
    } = req.body;

    const newCalibration = new Calibration({
      device,
      calibration_made,
      calibration_result,
      calibration_date,
      next_calibration_date,
      calibrated_by,
      calibrator_phone_number,
      notes,
    });

    await newCalibration.save();
    res.status(201).json(newCalibration);
  } catch (error) {
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
