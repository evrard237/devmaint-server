import express from "express";

import mongoose from "mongoose";
import cors from "cors";

import deviceRoutes from "./routes/devices.js";
import userRoutes from "./routes/user.js";
import departementRoutes from "./routes/department.js";
import authRoutes from "./routes/auth.js";
import globalErrorHandler from "./controllers/errorController.js";
import maintenanceCall from "./routes/maintenanceCall.js";
import maintenanceReport from "./routes/maintenanceReport.js";
import refreshToken from "./routes/refreshToken.js";
import cookieParser from "cookie-parser";
import { corsOptions } from "./config/corsOptions.js";
import { credentials } from "./utils/credentials.js";
import { CronJob } from "cron";
import cron from "node-cron";
import Device from "./db/models/device.model.js";
import sendEmail from "./utils/email.js";
import Notification from "./db/models/notification.js";
import setCorsHeaders from "./config/corsHeaders.js";

const app = express();

// app.use(credentials);

app.use(cors(corsOptions));

// app.use(json());
app.use(express.json());
app.use(cookieParser());

// cors middleware
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

console.log(new Date());
const prevDates = async () => {
  let today = new Date();
  let exactDate = today.getDate();
  console.log("exact", exactDate);

  await Device.find({ preventive_date: "2024-10-20T00:00:00.000+00:00" }).then(
    (responses) => {
      responses.forEach((response) => {
        const message = `This is to notify you that ${response.name} with serial no: ${response.serial_number} is due for maintenance`;
        try {
          sendEmail({
            email: "mbatseyolande@gmail.com",
            subject: `remider sent!!`,
            message: message,
          });
          let newNotification = new Notification({
            title: "Remider",
            message: message,
          });
          newNotification.save();
          res.status(200).json({
            status: "success",
            message: "password reset link has been send to your email",
          });
        } catch (error) {}
      });
    }
  );
};

const job = cron.schedule(
  "39 15 * * * ",
  function () {
    prevDates();
  },
  null,
  true,
  "America/Los_Angeles"
);

app.use(setCorsHeaders);

app.use("/device", deviceRoutes);
app.use("/department", departementRoutes);
app.use("/auth", authRoutes);
app.use("/refresh_token", refreshToken);
app.use("/user", userRoutes);
app.use("/maintenancecall", maintenanceCall);
app.use("/maintenancereport", maintenanceReport);
app.use(globalErrorHandler);

app.listen(process.env.PORT, () => {
  console.log(process.env.NODE_ENV);
  console.log(`server is listening on port ${process.env.PORT}`);
});
