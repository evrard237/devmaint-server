import Device from "../db/models/device.model.js";
import multer from "multer";
import aws from "aws-sdk";
import multerS3 from "multer-s3";
import moment from "moment";

// AWS S3 Configuration
const s3 = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_BUCKET_REGION,
});

// Multer-S3 Configuration (This is from your original working code)
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

// Helper function to calculate the next due date
const calculateNextDate = (startDate, cycle) => {
    const baseDate = moment(startDate);
    switch (cycle) {
        case 'daily': return baseDate.add(1, 'days').toDate();
        case 'weekly': return baseDate.add(1, 'weeks').toDate();
        case 'monthly': return baseDate.add(1, 'months').toDate();
        case 'quarterly': return baseDate.add(3, 'months').toDate();
        default: return baseDate.add(1, 'months').toDate();
    }
};

export const createDevice = (req, res, next) => {
  const uploadSingle = upload.fields([
    { name: "device_image", maxCount: 1 },
    { name: "device_manual", maxCount: 1 },
  ]);

  uploadSingle(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    try {
      const device = req.body;
      const newDevice = new Device({
        ...device,
        user: req.user?.name || "Unknown",
        device_image_url: req.files?.device_image ? req.files.device_image[0].location : null,
        device_manual_url: req.files?.device_manual ? req.files.device_manual[0].location : null,
        nextPreventiveDate: calculateNextDate(device.installation_date, device.maintenance_cycle),
      });
      const savedDevice = await newDevice.save();
      res.status(201).json({ success: true, data: savedDevice, message: "Device successfully created" });
    } catch (error) {
        if (req.files) {
            const keysToDelete = Object.values(req.files).flat().map(file => ({ Key: file.key }));
            if (keysToDelete.length > 0) {
                s3.deleteObjects({ Bucket: process.env.S3_BUCKET, Delete: { Objects: keysToDelete } }).promise();
            }
        }
        next(error);
    }
  });
};

export const getDevices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const department = req.query.department || '';

    const query = {};
    if (search) {
      query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { serial_number: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) { query.status = status; }
    if (department) { query.department = department; }

    const [devices, total] = await Promise.all([
      Device.find(query)
        .populate('department')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Device.countDocuments(query)
    ]);

    res.status(200).json({
      results: devices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getDevicesPerDept = async (req, res, next) => {
  try {
    const response = await Device.find({ department: req.params.id, status: { $eq: "Up" } });
    res.send(response);
  } catch (error) {
    next(error);
  }
};

export const getDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).send({ message: 'Device not found' });
    res.send(device);
  } catch (error) {
    next(error);
  }
};

export const updateDevice = (req, res, next) => {
  const uploadFiles = upload.fields([
    { name: "device_image", maxCount: 1 },
    { name: "device_manual", maxCount: 1 },
  ]);

  uploadFiles(req, res, async (err) => {
    if (err) { return res.status(400).json({ success: false, message: err.message }); }
    try {
      const { id } = req.params;
      const updates = req.body;
      const existingDevice = await Device.findById(id);
      if (!existingDevice) { return res.status(404).json({ success: false, message: "Device not found" }); }
      
      const newFiles = {};
      if (req.files?.device_image) {
        newFiles.device_image_url = req.files.device_image[0].location;
        if (existingDevice.device_image_url) {
            const oldKey = new URL(existingDevice.device_image_url).pathname.substring(1);
            s3.deleteObject({ Bucket: process.env.S3_BUCKET, Key: oldKey }).promise();
        }
      }
      if (req.files?.device_manual) {
        newFiles.device_manual_url = req.files.device_manual[0].location;
        if (existingDevice.device_manual_url) {
            const oldKey = new URL(existingDevice.device_manual_url).pathname.substring(1);
            s3.deleteObject({ Bucket: process.env.S3_BUCKET, Key: oldKey }).promise();
        }
      }
      const updatedData = { ...updates, ...newFiles, user: req.user?.name || "Unknown" };
      await Device.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
      res.status(200).json("Device successfully Updated !!");
    } catch (error) {
      next(error);
    }
  });
};

export const deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) { return res.status(404).json({ success: false, message: "Device not found" }); }
    
    const filesToDelete = [];
    if (device.device_image_url) filesToDelete.push({ Key: new URL(device.device_image_url).pathname.substring(1) });
    if (device.device_manual_url) filesToDelete.push({ Key: new URL(device.device_manual_url).pathname.substring(1) });

    if (filesToDelete.length > 0) {
      s3.deleteObjects({ Bucket: process.env.S3_BUCKET, Delete: { Objects: filesToDelete } }).promise();
    }
    
    await Device.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Device and associated files deleted successfully" });
  } catch (error) {
    next(error);
  }
};