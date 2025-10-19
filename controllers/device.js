import Device from "../db/models/device.model.js";
import multer from "multer";
import aws from "aws-sdk";
// import multerS3 from "multer-s3";
import moment from "moment";
import multerS3 from "multer-s3";

// AWS S3 Configuration
const s3 = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_BUCKET_REGION,
});

// Multer-S3 Configuration for file uploads
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

// Helper function to calculate the next due date based on the maintenance cycle
const calculateNextDate = (startDate, cycle) => {
    const baseDate = moment(startDate);
    switch (cycle) {
        case 'daily': return baseDate.add(1, 'days').toDate();
        case 'weekly': return baseDate.add(1, 'weeks').toDate();
        case 'monthly': return baseDate.add(1, 'months').toDate();
        case 'quarterly': return baseDate.add(3, 'months').toDate();
        default: return baseDate.add(1, 'months').toDate(); // Default to monthly if cycle is not specified
    }
};

export const createDevice = async (req, res) => {
  const uploadSingle = upload.fields([
    { name: "device_image", maxCount: 1 },
    { name: "device_manual", maxCount: 1 },
  ]);

  uploadSingle(req, res, async (err) => {
    if (err) {
      console.log("Multer error on create:", err);
      return res.status(400).json({ success: false, message: err.message });
    }

    let uploadedFiles = { device_image: null, device_manual: null };

    try {
      const device = req.body;
      const files = req.files;

      if (files.device_image) {
        uploadedFiles.device_image = files.device_image[0].key;
      }
      if (files.device_manual) {
        uploadedFiles.device_manual = files.device_manual[0].key;
      }

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
        // --- THIS IS THE NEW LOGIC ---
        // Automatically set the first preventive maintenance date upon creation.
        nextPreventiveDate: calculateNextDate(device.installation_date, device.maintenance_cycle),
      });

      const savedDevice = await newDevice.save();
      res.status(201).json({ success: true, data: savedDevice, message: "Device successfully created" });
    } catch (error) {
      console.error("Error saving device:", error);
      // Attempt to clean up orphaned S3 files if database save fails
      const deletePromises = [];
      if (uploadedFiles.device_image) {
        deletePromises.push(s3.deleteObject({ Bucket: process.env.S3_BUCKET, Key: uploadedFiles.device_image }).promise());
      }
      if (uploadedFiles.device_manual) {
        deletePromises.push(s3.deleteObject({ Bucket: process.env.S3_BUCKET, Key: uploadedFiles.device_manual }).promise());
      }
      await Promise.all(deletePromises).catch(s3Error => console.error("Failed to clean up S3 files:", s3Error));
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });
};

export const getDevices = async (req, res) => {
  try {
    const devices = await Device.find({}).populate('department');
    res.send(devices);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Error fetching devices' });
  }
};

export const getDevicesPerDept = async (req, res, next) => {
  try {
    const response = await Device.find({ department: req.params.id, status: { $eq: "Up" } });
    if (response.length === 0) {
      res.send("empty array");
    } else {
      res.send(response);
    }
  } catch (error) {
    next(error);
  }
};

export const getDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    res.send(device);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Error fetching single device' });
  }
};

export const updateDevice = async (req, res) => {
  const uploadFiles = upload.fields([
    { name: "device_image", maxCount: 1 },
    { name: "device_manual", maxCount: 1 },
  ]);

  uploadFiles(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    try {
      const { id } = req.params;
      const updates = req.body;
      const bucketName = process.env.S3_BUCKET;
      const existingDevice = await Device.findById(id);
      if (!existingDevice) {
        return res.status(404).json({ success: false, message: "Device not found" });
      }
      const filesToDelete = [];
      const newFiles = {};
      if (req.files?.device_image) {
        newFiles.device_image_url = req.files.device_image[0].location;
        if (existingDevice.device_image_url) {
          filesToDelete.push({ url: existingDevice.device_image_url });
        }
      }
      if (req.files?.device_manual) {
        newFiles.device_manual_url = req.files.device_manual[0].location;
        if (existingDevice.device_manual_url) {
          filesToDelete.push({ url: existingDevice.device_manual_url });
        }
      }
      if (filesToDelete.length > 0) {
        await Promise.all(filesToDelete.map(async (file) => {
            const oldKey = new URL(file.url).pathname.substring(1);
            await s3.deleteObject({ Bucket: bucketName, Key: oldKey }).promise();
        }));
      }
      const updatedData = { ...updates, ...newFiles, user: req.user?.name || "Unknown", updatedAt: new Date() };
      await Device.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
      res.status(200).json("Device successfully Updated !!");
    } catch (error) {
      console.error("Error updating device:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });
};

export const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }
    const bucketName = process.env.S3_BUCKET;
    const filesToDelete = [];
    if (device.device_image_url) filesToDelete.push(device.device_image_url);
    if (device.device_manual_url) filesToDelete.push(device.device_manual_url);

    if (filesToDelete.length > 0) {
        await Promise.all(filesToDelete.map(async (url) => {
            try {
                const key = new URL(url).pathname.substring(1);
                await s3.deleteObject({ Bucket: bucketName, Key: key }).promise();
            } catch (s3Error) {
                console.error(`S3 deletion failed for ${url}:`, s3Error);
                // Decide if you want to stop the process if S3 delete fails
            }
        }));
    }
    
    await Device.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Device and associated files deleted successfully" });
  } catch (error) {
    console.error("Error deleting device:", error);
    res.status(500).json({ success: false, message: "Server error while deleting device", error: error.message });
  }
};