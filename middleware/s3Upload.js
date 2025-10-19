import multer from "multer";
import aws from "aws-sdk";
import multerS3 from "multer-s3";

// This configuration is now safely inside a middleware file.
// It will only be initialized when the routes are set up, after dotenv has loaded.
const s3 = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_BUCKET_REGION,
});

const s3Storage = (folderName) => multerS3({
    s3,
    bucket: process.env.S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${folderName}/${uniqueSuffix}-${file.originalname}`);
    },
});

// Middleware for uploading device files (image and manual)
export const uploadDeviceFiles = multer({
  storage: s3Storage('device-files')
}).fields([
    { name: "device_image", maxCount: 1 },
    { name: "device_manual", maxCount: 1 },
]);

// Middleware for uploading a single calibration certificate
export const uploadCertificate = multer({
  storage: s3Storage('calibration-certificates')
}).single('certificate');