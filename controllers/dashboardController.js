import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import Device from "../db/models/device.model.js";
import User from "../db/models/user.js";


import Department from "../db/models/department.js";
import MaintenanceCall from "../db/models/maintenanceCall.js";
import MaintenanceReport from "../db/models/maintenanceReport.js";

export const getDashboardStats = asyncErrorHandler(async (req, res, next) => {
    // Use Promise.all to fetch all data concurrently for better performance
    const [
        totalDepartments,
        totalDevices,
        devicesUp,
        devicesDown,
        totalUsers,
        totalMaintenanceCalls,
        pendingMaintenanceCalls,
        totalMaintenanceReports,
        recentCalls,
        recentReports,
        callsByMonth
    ] = await Promise.all([
        Department.countDocuments(),
        Device.countDocuments(),
        Device.countDocuments({ status: 'Up' }),
        Device.countDocuments({ status: 'Down' }),
        User.countDocuments(),
        MaintenanceCall.countDocuments(),
        MaintenanceCall.countDocuments({ call_status: 'pending' }),
        MaintenanceReport.countDocuments(),
        // Get the 5 most recent calls
        MaintenanceCall.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('device', 'name')
            .populate('user', 'name'),
        // Get the 5 most recent reports
        MaintenanceReport.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('device', 'name')
            .populate('user', 'name'),
        // Aggregation pipeline to count calls per month for the last 12 months
        MaintenanceCall.aggregate([
            { $match: { createdAt: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) } } },
            { $group: {
                _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ])
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalDepartments,
            totalDevices,
            devicesUp,
            devicesDown,
            totalUsers,
            totalMaintenanceCalls,
            pendingMaintenanceCalls,
            totalMaintenanceReports,
            recentCalls,
            recentReports,
            callsByMonth
        }
    });
});