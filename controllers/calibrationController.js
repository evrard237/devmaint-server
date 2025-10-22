import CalibrationLog from '../db/models/calibration.model.js';
import Device from '../db/models/device.model.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import multer from "multer";
import aws from "aws-sdk";
import multerS3 from "multer-s3";
import ExcelJS from 'exceljs';
import moment from 'moment';

const s3 = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_BUCKET_REGION,
});

export const uploadCertificate = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `calibration-certificates/${uniqueSuffix}-${file.originalname}`);
    },
  }),
});

export const createCalibrationLog = asyncErrorHandler(async (req, res, next) => {
    const logData = req.body;
    try {
        const newLog = new CalibrationLog({
            ...logData,
            certificateUrl: req.file ? req.file.location : null,
        });
        await newLog.save();
        await Device.findByIdAndUpdate(logData.device, { $set: { nextCalibrationDate: logData.nextCalibrationDate } });
        res.status(201).json(newLog);
    } catch (dbError) {
        if (req.file) {
            s3.deleteObject({ Bucket: process.env.S3_BUCKET, Key: req.file.key }).promise()
              .catch(s3Error => console.error("Failed to delete orphaned S3 file:", s3Error));
        }
        next(dbError);
    }
});

export const getAllCalibrationLogs = asyncErrorHandler(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = {};
    
    const [logs, total] = await Promise.all([
        CalibrationLog.find(query)
            .populate('device', 'name')
            .sort({ lastCalibrated: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        CalibrationLog.countDocuments(query)
    ]);

    res.status(200).json({
        results: logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    });
});

export const getCalibrationLogsForDevice = asyncErrorHandler(async (req, res, next) => {
    const { deviceId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const [logs, total] = await Promise.all([
        CalibrationLog.find({ device: deviceId })
            .sort({ lastCalibrated: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        CalibrationLog.countDocuments({ device: deviceId })
    ]);
    
    res.status(200).json({
        results: logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    });
});

export const invalidateCalibrationLog = asyncErrorHandler(async (req, res, next) => {
    const { logId } = req.params;
    const log = await CalibrationLog.findByIdAndUpdate(
        logId,
        { $set: { recordStatus: 'Entered in Error' } },
        { new: true }
    );
    if (!log) {
        return res.status(404).json({ message: 'Log not found' });
    }
    res.status(200).json({ message: 'Log has been marked as an error.', log });
});

export const exportCalibrationLogs = asyncErrorHandler(async (req, res, next) => {
    const logs = await CalibrationLog.find({})
        .populate('device', 'name serial_number')
        .sort({ lastCalibrated: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Calibration Logs');

    worksheet.columns = [
        { header: 'Device Name', key: 'deviceName', width: 30 },
        { header: 'Device S/N', key: 'deviceSn', width: 20 },
        { header: 'Calibration Date', key: 'lastCalibrated', width: 20 },
        { header: 'Next Due Date', key: 'nextCalibrationDate', width: 20 },
        { header: 'Calibrated By', key: 'calibratedBy', width: 30 },
        { header: 'Type', key: 'calibrationType', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Record Status', key: 'recordStatus', width: 20 },
    ];
    worksheet.getRow(1).font = { bold: true };

    logs.forEach(log => {
        worksheet.addRow({
            deviceName: log.device ? log.device.name : 'N/A',
            deviceSn: log.device ? log.device.serial_number : 'N/A',
            lastCalibrated: moment(log.lastCalibrated).format('YYYY-MM-DD'),
            nextCalibrationDate: moment(log.nextCalibrationDate).format('YYYY-MM-DD'),
            calibratedBy: log.calibratedBy,
            calibrationType: log.calibrationType,
            status: log.status,
            recordStatus: log.recordStatus,
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Calibration-Logs.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
});