//this file will handle connection to the mangodb database

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

mongoose.Promise = global.Promise;
// `mongodb+srv://evrardmodi:${process.env.DB_PASSWORD}@cluster0.ro4iufy.mongodb.net/`
mongoose
  .connect(
    `mongodb+srv://evrardmodi:${process.env.DB_PASSWORD}@cluster0.ro4iufy.mongodb.net/`,
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

// to prevent deprectation warnings
// mongoose.set('useCreateIndex', true);
// mongoose.set('useFindAndModify', false);

// module.exports ={
//     mongoose
// };
export { mongoose };
