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
    const { device, maintenance_type, nature_of_problem } = req.body;

    // Prevent duplicate open calls for same device and type
    let exist = await MaintenanceCall.findOne({
      device,
      maintenance_type,
      call_status: "pending"
    });

    if (exist) {
      return res.status(400).json({ message: "Request already sent!!!" });
    }

    try {
      const newMaintenanceCall = new MaintenanceCall({
        device,
        user: req.user._id,
        department: req.user.department,
        maintenance_type,
        call_status: "pending",
        nature_of_problem,
        date: new Date(),
      });

      await newMaintenanceCall.save();

      // Optionally update device status
      await Device.findByIdAndUpdate(device, { $set: { status: "Down" } });

      res.status(201).json(newMaintenanceCall);
    } catch (error) {
      next(error);
    }
  }
);



export const getListMaintenanceCall = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const list = await MaintenanceCall.find({})
        .populate('device')
        .populate('user')
        .populate('department');
      res.status(200).json(list);
    } catch (error) {
      next(error);
    }
  }
);

export const getMaintenanceCallsPerUser = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const calls = await MaintenanceCall.find({ user: req.user._id })
        .populate('device')
        .populate('user');
      res.send(calls);
    } catch (error) {
      next(error);
    }
  }
);

export const getSingleMaintenanceCall = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const call = await MaintenanceCall.findById(req.params.id)
        .populate('device')
        .populate('user');
      res.send(call);
    } catch (error) {
      next(error);
    }
  }
);

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
