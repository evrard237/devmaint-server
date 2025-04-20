import Device from "../db/models/device.model.js";
import multer from "multer";
import aws from "aws-sdk";
import multerS3 from "multer-s3";

import express from "express";
import bodyParser from "body-parser";
import { mongoose } from "../db/mongoose.js";
import Calibration from "../db/models/calibration.js";
const app = express();

const s3 = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_BUCKET_REGION,
});

// Multer configuration for S3
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET, 
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
  }),
});

export const createDevice = async (req, res) => {
  const uploadSingle = upload.fields([
    {name: "device_image", maxCount: 1},
    {name: "device_manual", maxCount: 1}
  ]);

  uploadSingle(req, res, async (err) => {
    if (err) {
      console.log("erreur", err);
      return res.status(400).json({ success: false, message: err.message });
    }

    // Variables to store the uploaded file keys for cleanup if needed
    let uploadedFiles = {
      device_image: null,
      device_manual: null
    };

    try {
      const device = req.body;
      const files = req.files;
      console.log("sent doc", req.files);

      // Store the S3 keys of uploaded files
      if (files.device_image) {
        uploadedFiles.device_image = files.device_image[0].key;
      }
      if (files.device_manual) {
        uploadedFiles.device_manual = files.device_manual[0].key;
      }

      // Create a new device document
      const newDevice = new Device({
        name: device.name,
        model: device.model,
        serial_number: device.serial_number,
        brand: device.brand,
        purchase_type: device.purchase_type,
        department: device.department,
        user: req.user?.name || "Unknown",
        status: device.status,
        maintenance_cycle: device.maintenance_cycle,
        service_engineer_number: device.service_engineer_number,
        purchase_date: device.purchase_date,
        installation_date: device.installation_date,
        warranty_due_date: device.warranty_due_date,
        notes: device.notes,
        device_image_url: files.device_image ? files.device_image[0].location : null,
        device_manual_url: files.device_manual ? files.device_manual[0].location : null,
      });

      // Save the device to the database
      const savedDevice = await newDevice.save();
      res.status(201).json({ success: true, data: savedDevice,message:"device successfully created" });
    } catch (error) {
      console.error("Error saving device:", error);
      
      // Attempt to delete uploaded files if MongoDB save failed
      try {
        const deletePromises = [];
        
        if (uploadedFiles.device_image) {
          deletePromises.push(
            s3.deleteObject({
              Bucket: process.env.S3_BUCKET,
              Key: uploadedFiles.device_image
            }).promise()
          );
        }
        
        if (uploadedFiles.device_manual) {
          deletePromises.push(
            s3.deleteObject({
              Bucket: process.env.S3_BUCKET,
              Key: uploadedFiles.device_manual
            }).promise()
          );
        }
        
        if (deletePromises.length > 0) {
          await Promise.all(deletePromises);
          console.log("Successfully deleted uploaded files from S3 due to MongoDB save failure");
        }
      } catch (s3Error) {
        console.error("Failed to delete uploaded files from S3:", s3Error);
        // Continue with the original error response even if cleanup fails
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Server error",
        error: error.message 
      });
    }
  });
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
    Device.find({ department: req.params.id, status: { $eq: "Up" } }).then(
      (response) => {
        if (response.length === 0) {
          res.send("empty array");
        } else {
          res.send(response);
        }
      }
    );
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
  const uploadSingle = upload.single("device_image");

  uploadSingle(req, res, async (err) => {
    if (err) {
      console.error("Multer upload error:", err);
      return res.status(400).json({ success: false, message: err.message });
    }


    try {
      const { id } = req.params;
      const updates = req.body;
      const bucketName = process.env.S3_BUCKET || "device237bucket";

      // 1. Find the existing device
      const existingDevice = await Device.findById(id);
      if (!existingDevice) {
        return res
          .status(404)
          .json({ success: false, message: "Device not found" });
      }

      // 2. Handle image update if new file was uploaded
      if (req.file) {
        console.log("New image uploaded:", req.file.location);

        // Delete old image if it exists
        if (existingDevice.device_image_url) {
          try {
            const oldImageUrl = existingDevice.device_image_url;
            const url = new URL(oldImageUrl);
            const oldKey = url.pathname.substring(1); // Remove leading slash

            console.log(`Attempting to delete old S3 object: ${oldKey}`);

            await s3
              .deleteObject({
                Bucket: bucketName,
                Key: oldKey,
              })
              .promise();

            console.log("Successfully deleted old S3 object");
          } catch (s3Error) {
            console.error("Failed to delete old S3 object:", s3Error);
            // Continue with update even if deletion fails
          }
        }

        // Add new image URL to updates
        updates.device_image_url = req.file.location;
      }

      // 3. Prepare the updated device data
      const updatedData = {
        ...updates,
        user: req.user?.name || "Unknown",
        updatedAt: new Date(),
      };

      // 4. Update MongoDB
      const updatedDevice = await Device.findByIdAndUpdate(id, updatedData, {
        new: true,
        runValidators: true,
      });

      console.log("Device successfully updated:", updatedDevice);
      res.status(200).json({ success: true, data: updatedDevice });
    } catch (error) {
      console.error("Error updating device:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  });
};

// export const deleteDevice = async (req, res) => {
//   try {
//     Device.findOneAndDelete({
//       _id: req.params.id,
//     }).then((removedDeviceDoc) => {
//       s3.deleteObject()
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

export const deleteDevice = async (req, res) => {
  try {
    // 1. Find the device first
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // 2. Extract S3 key (handle missing URL)
    const url = device.device_image_url;
    const bucketName = process.env.S3_BUCKET || "device237bucket"; // Best practice: Use env var

    let key;
    if (url) {
      if (url.includes(`/${bucketName}/`)) {
        key = url.split(`/${bucketName}/`)[1];
      } else if (url.includes("amazonaws.com/")) {
        key = url.split("amazonaws.com/")[1];
      } else {
        key = url.split("/").pop();
      }
      key = decodeURIComponent(key).split("?")[0]; // Decode %20 and remove query params
    }

    // 3. Delete S3 object first (avoid orphaned files)
    if (key) {
      try {
        await s3
          .deleteObject({
            Bucket: bucketName,
            Key: key,
          })
          .promise();
      } catch (s3Error) {
        console.error("S3 deletion failed:", s3Error);
        return res.status(500).json({
          success: false,
          message: "Failed to delete device image from S3",
          error: s3Error.message,
        });
      }
    }

    // 4. Delete from MongoDB (only after S3 succeeds)
    const deletedDevice = await Device.findByIdAndDelete(req.params.id);

    if (!deletedDevice) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Device and associated image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting device:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting device",
      error: error.message,
    });
  }
};
// var preventive = new Date();
// let maintCycle = device.maintenance_cycle;

// switch (maintCycle) {
//   case "daily":
//     var insD = new Date(device.installation_date);
//     var temp = insD.setDate(insD.getDate() + 1);
//     preventive = new Date(temp);
//     break;
//   case "weekly":
//     var insD = new Date(device.installation_date);
//     var temp = insD.setDate(insD.getDate() + 7);
//     preventive = new Date(temp);
//     break;
//   case "monthly":
//     var insD = new Date(device.installation_date);
//     var temp = insD.setDate(insD.getDate() + 4 * 7);
//     preventive = new Date(temp);
//     break;
//   case "quarterly":
//     var insD = new Date(device.installation_date);
//     var temp = insD.setDate(insD.getDate() + 12 * 7);
//     preventive = new Date(temp);
// }
