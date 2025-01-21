import express from "express";

// import mongoose from 'mongoose'
import { mongoose } from "../db/mongoose.js";
import jwt from "jsonwebtoken";
import verifyRefreshToken from "../utils/verifyRefreshToken.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());

// export const refreshToken = async (req,res,next) =>{
//     verifyRefreshToken(req.body.refreshToken)
// 		.then(({ tokenDetails }) => {
// 			const payload = { _id: tokenDetails._id, roles: tokenDetails.roles };
// 			const accessToken = jwt.sign(
// 				payload,
// 				process.env.ACCESS_TOKEN_PRIVATE_KEY,
// 				{ expiresIn: "14m" }
// 			);
// 			res.status(200).json({
// 				error: false,
// 				accessToken,
// 				message: "Access token created successfully",
// 			});
// 		})
// 		.catch((err) => res.status(400).json(err));
// }

export const refreshToken = async (req, res) => {
  const cookies = req.cookies;
  console.log("jwt in cookie", cookies.jwt);
  if (!cookies.jwt) return res.status(401).json({ message: "Unauthorized" });
  const refreshToken = cookies.jwt;

  verifyRefreshToken(refreshToken)
    .then(({ tokenDetails }) => {
      // console.log("token details =",tokenDetails.id);
      const payload = { _id: tokenDetails.id, roles: tokenDetails.role };
      console.log("payload", payload);

      const accessToken = jwt.sign(payload, process.env.SECRET_STR, {
        expiresIn: 60 * 2,
      });
      res.status(200).json({
        error: false,
        accessToken,
        message: "Access token created successfully",
      });
    })

    .catch((err) => {
      res.status(400).json(err);
    });
};
