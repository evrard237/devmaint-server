//this file will handle connection to the mangodb database

import dotenv from "dotenv";
import mongoose from "mongoose";
import Grid from "gridfs-stream"

dotenv.config();

mongoose.Promise = global.Promise;
const mongoURI = `mongodb+srv://evrardmodi:${process.env.DB_PASSWORD}@cluster0.ro4iufy.mongodb.net/`

 mongoose
  .connect(
    mongoURI,
    { connectTimeoutMS: 60000 },
    { useNewUrlParser: true }
  )
  .then(() => {
    console.log("connection to mongodb successful");
  })
  .catch((e) => {
    console.log("error while attempting to connect to mongoDb");
    console.log(e);
  });



export { mongoose};
