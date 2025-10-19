import PreventiveMaintenance from '../db/models/preventiveMaintenance.model.js';
import Device from '../db/models/device.model.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import moment from 'moment';
import ExcelJS from 'exceljs';

// Helper function to calculate the next due date based on the device's maintenance cycle
const calculateNextDate = (cycle) => {
    switch (cycle) {
        case 'daily': return moment().add(1, 'days').toDate();
        case 'weekly': return moment().add(1, 'weeks').toDate();
        case 'monthly': return moment().add(1, 'months').toDate();
        case 'quarterly': return moment().add(3, 'months').toDate();
        default: return moment().add(1, 'months').toDate();
    }
};

export const createPreventiveMaintenance = asyncErrorHandler(async (req, res, next) => {
    const reportData = req.body;
    reportData.performedBy = req.user._id;

    const newReport = new PreventiveMaintenance(reportData);
    await newReport.save();

    // After saving the report, find the device and update its next due date
    const device = await Device.findById(reportData.device);
    if (device) {
        device.nextPreventiveDate = calculateNextDate(device.maintenance_cycle);
        await device.save();
    }

    res.status(201).json(newReport);
});

export const getPreventiveMaintenancesForDevice = asyncErrorHandler(async (req, res, next) => {
    const { deviceId } = req.params;
    const reports = await PreventiveMaintenance.find({ device: deviceId })
        .populate('performedBy', 'name')
        .sort({ createdAt: -1 });
    res.status(200).json(reports);
});

export const getAllPreventiveReports = asyncErrorHandler(async (req, res, next) => {
    const reports = await PreventiveMaintenance.find({})
        .populate('device', 'name')
        .populate('performedBy', 'name')
        .sort({ createdAt: -1 });
    res.status(200).json(reports);
});

export const invalidatePreventiveReport = asyncErrorHandler(async (req, res, next) => {
    const { reportId } = req.params;
    const report = await PreventiveMaintenance.findByIdAndUpdate(
        reportId,
        { $set: { status: 'Entered in Error' } },
        { new: true }
    );
    if (!report) {
        return res.status(404).json({ message: 'Preventive report not found' });
    }
    res.status(200).json({ message: 'Report has been marked as an error.', report });
});

export const exportPreventiveReports = asyncErrorHandler(async (req, res, next) => {
    const reports = await PreventiveMaintenance.find({})
        .populate('device', 'name serial_number')
        .populate('performedBy', 'name')
        .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Preventive Maintenance Reports');

    // Define columns and their properties
    worksheet.columns = [
        { header: 'Report No.', key: 'report_number', width: 15 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Device Name', key: 'deviceName', width: 30 },
        { header: 'Device S/N', key: 'deviceSn', width: 20 },
        { header: 'Performed By', key: 'performedBy', width: 25 },
        { header: 'Tasks Performed', key: 'tasksPerformed', width: 50 },
        { header: 'Observations', key: 'observations', width: 50 },
        { header: 'Status', key: 'status', width: 15 },
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    reports.forEach(report => {
        worksheet.addRow({
            report_number: report.report_number,
            date: moment(report.createdAt).format('YYYY-MM-DD'),
            deviceName: report.device ? report.device.name : 'N/A',
            deviceSn: report.device ? report.device.serial_number : 'N/A',
            performedBy: report.performedBy ? report.performedBy.name : 'N/A',
            tasksPerformed: report.tasksPerformed,
            observations: report.observations,
            status: report.status,
        });
    });

    // Set response headers to trigger download
    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
        'Content-Disposition',
        'attachment; filename="Preventive-Maintenance-Reports.xlsx"'
    );

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
});