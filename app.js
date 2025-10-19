import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import url from "url";

// Model Imports
import Device from "./db/models/device.model.js";
import Notification from "./db/models/notification.js";
import User from "./db/models/user.js";

// Route Imports
import deviceRoutes from "./routes/devices.js";
import userRoutes from "./routes/user.js";
import departementRoutes from "./routes/department.js";
import authRoutes from "./routes/auth.js";
import maintenanceCall from "./routes/maintenanceCall.js";
import maintenanceReport from "./routes/maintenanceReport.js";
import refreshToken from "./routes/refreshToken.js";
import scheduleRoutes from "./routes/schedule.js";
import notificationRoutes from "./routes/notification.js";
import preventiveRoutes from "./routes/preventive.js";
import calibrationRoutes from "./routes/calibration.js";
import dashboardRoutes from "./routes/dashboard.js";

// Util Imports
import globalErrorHandler from "./controllers/errorController.js";
import { corsOptions } from "./config/corsOptions.js";
import cron from "node-cron";
import sendEmail from "./utils/email.js";

const app = express();
const server = http.createServer(app);

// --- PROFESSIONAL WEBSOCKET SERVER IMPLEMENTATION ---
const wss = new WebSocketServer({ server });

const broadcast = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify(data));
        }
    });
};

wss.on("connection", async (ws, req) => {
    const token = url.parse(req.url, true).query.token;
    if (!token) { return ws.close(1008, "No token provided"); }
    try {
        const decoded = jwt.verify(token, process.env.SECRET_STR);
        const userId = decoded.id || decoded._id;
        ws.userId = userId;
        await User.findByIdAndUpdate(userId, { status: 'online' });
        broadcast({ type: 'userStatus', data: { userId, status: 'online' } });
        console.log(`User ${userId} connected and is online.`);
    } catch (err) {
        console.error("WebSocket authentication error:", err.message);
        return ws.close(1008, "Invalid token");
    }
    ws.on("close", async () => {
        if (ws.userId) {
            let isStillConnected = false;
            for (const client of wss.clients) {
                if (client.userId === ws.userId && client !== ws) {
                    isStillConnected = true;
                    break;
                }
            }
            if (!isStillConnected) {
                await User.findByIdAndUpdate(ws.userId, { status: 'offline' });
                broadcast({ type: 'userStatus', data: { userId: ws.userId, status: 'offline' } });
                console.log(`User ${ws.userId} disconnected and is offline.`);
            }
        }
    });
});

export const broadcastUserStatus = (userId, status) => { broadcast({ type: 'userStatus', data: { userId, status } }); };
export const broadcastNotification = (notification) => { broadcast({ type: 'notification', data: notification }); };
// --- END OF WEBSOCKET IMPLEMENTATION ---

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// --- FULL CRON JOB FOR AUTOMATED REMINDERS ---
cron.schedule('0 8 * * *', async () => {
    console.log('Running daily maintenance reminder check...');
    try {
        const technicians = await User.find({ role: 'technician' });
        if (technicians.length === 0) {
            console.log('No technicians found to send reminders.');
            return;
        }
        const recipientEmails = technicians.map(t => t.email);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const checkAndNotify = async (devices, type) => {
            for (const device of devices) {
                const message = `Reminder: ${type} maintenance is due for device '${device.name}' (S/N: ${device.serial_number}).`;
                const newNotification = new Notification({ title: `${type} Reminder`, message });
                await newNotification.save();
                broadcastNotification(newNotification);
                try {
                    await sendEmail({ email: recipientEmails.join(','), subject: `Maintenance Due: ${device.name}`, message });
                } catch (error) {
                    console.error(`Failed to send email for ${device.name}:`, error);
                }
            }
        };

        const preventiveDue = await Device.find({ nextPreventiveDate: { $in: [today, tomorrow] } }).populate('department', 'name');
        if (preventiveDue.length > 0) {
            console.log(`Found ${preventiveDue.length} devices due for preventive maintenance.`);
            await checkAndNotify(preventiveDue, 'Preventive');
        }

        const calibrationDue = await Device.find({ nextCalibrationDate: { $in: [today, tomorrow] } }).populate('department', 'name');
        if (calibrationDue.length > 0) {
            console.log(`Found ${calibrationDue.length} devices due for calibration.`);
            await checkAndNotify(calibrationDue, 'Calibration');
        }
    } catch (error) {
        console.error('Error during daily reminder check:', error);
    }
});
// --- END OF CRON JOB ---

// API Routes
app.use("/device", deviceRoutes);
app.use("/department", departementRoutes);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/maintenancecall", maintenanceCall);
app.use("/maintenancereport", maintenanceReport);
app.use("/api/schedule", scheduleRoutes);
app.use("/notification", notificationRoutes);
app.use("/preventive", preventiveRoutes);
app.use("/calibration", calibrationRoutes);
app.use("/refresh_token", refreshToken);
app.use("/dashboard", dashboardRoutes);

// Global Error Handler
app.use(globalErrorHandler);

// Start Server
server.listen(process.env.PORT, () => {
  console.log(`Server is listening on port ${process.env.PORT}`);
});