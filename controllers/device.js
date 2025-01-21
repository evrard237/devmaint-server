import Device from "../db/models/device.model.js";

import express from "express";
import bodyParser from "body-parser";
import { mongoose } from "../db/mongoose.js";
import Calibration from "../db/models/calibration.js";
const app = express();

export const createDevice = async (req, res, next) => {
  let device = req.body;

  var preventive = new Date();
  let maintCycle = device.maintenance_cycle;

  switch (maintCycle) {
    case "daily":
      var insD = new Date(device.installation_date);
      var temp = insD.setDate(insD.getDate() + 1);
      preventive = new Date(temp);
      break;
    case "weekly":
      var insD = new Date(device.installation_date);
      var temp = insD.setDate(insD.getDate() + 7);
      preventive = new Date(temp);
      break;
    case "monthly":
      var insD = new Date(device.installation_date);
      var temp = insD.setDate(insD.getDate() + 4 * 7);
      preventive = new Date(temp);
      break;
    case "trimestrial":
      var insD = new Date(device.installation_date);
      var temp = insD.setDate(insD.getDate() + 12 * 7);
      preventive = new Date(temp);
  }

  let newDevice = new Device({
    name: device.name,
    model: device.model,
    serial_number: device.serial_number,
    brand: device.brand,
    purchase_type: device.purchase_type,
    department: device.department,
    user: req.user.name,
    status: device.status,
    maintenance_cycle: maintCycle,
    service_engineer_number: device.service_engineer_number,
    purchase_date: device.purchase_date,
    installation_date: device.installation_date,
    preventive_date: preventive,
    warranty_due_date: device.warranty_due_date,
  });

  let newCalibration = new Calibration({
    device_name: device.name,
    model: device.model,
    serial_number: device.serial_number,
    diagnosis: device.maintenance.diagnosis,
    action: device.maintenance.action,
  });

  try {
    await newCalibration.save();
    await newDevice.save().then((deviceDoc) => {
      res.send(deviceDoc);
    });
  } catch (error) {
    next(error);
  }
};

export const getDevices = async (req, res) => {
  try {
    Device.find({}).then((devices) => {
      res.send(devices);
    });
  } catch (error) {
    console.log(error);
  }
};

export const getDevicesPerDept = async (req, res, next) => {
  try {
    Device.find({ department: req.params.id,status:{$eq: "Up"} }).then((response) => {
      if (response.length === 0) {
        res.send("empty array");
      } else {
        res.send(response);
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDevice = async (req, res) => {
  try {
    Device.findById({ _id: req.params.id }).then((device) => {
      res.send(device);
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateDevice = async (req, res) => {
  try {
    Device.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: req.body,
      }
    ).then(() => {
      res.sendStatus(200);
    });
  } catch (error) {
    console.log(error);
  }
};

export const deleteDevice = async (req, res) => {
  try {
    Device.findOneAndDelete({
      _id: req.params.id,
    }).then((removedDeviceDoc) => {
      Calibration.findOneAndDelete({
        serial_number: removedDeviceDoc.serial_number,
      }).then((removedDeviceCal) => {
        res.send(removedDeviceDoc);
      });
      // res.send(removedDeviceDoc);
    });
  } catch (error) {
    console.log(error);
  }
};
