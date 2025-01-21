
import jwt from  'jsonwebtoken';

import UserToken from '../db/models/userToken.js';

// const verifyRefreshToken = (refreshToken) => {
// 	const privateKey = process.env.REFRESH_TOKEN_SECRET;
  
// 	return new Promise((resolve, reject) => {
// 	  UserToken.findOne({ token: refreshToken }, (err, doc) => {
// 		if (!doc) {
// 			console.log("error1");
// 		  return reject({ error: true, message: "Invalid refresh token" });
// 		}
// 		jwt.verify(refreshToken, privateKey, (err, decoded) => {
// 		  if (err) {
// 			  console.log("error2");
// 			return reject({ error: true, message: "Invalid refresh token" });
// 		  }
// 		  resolve({
// 			tokenDetails: decoded,
// 			error: false,
// 			message: "Valid refresh token",
// 		  });
// 		});
// 	  });
// 	});
//   };


const verifyRefreshToken = async (refreshToken) => {
	const privateKey = process.env.REFRESH_TOKEN_SECRET;
	
	try {
	  const doc = await UserToken.findOne({ token: refreshToken }).exec();
	  
	  if (!doc) {
		throw { error: true, message: "Invalid refresh token" };
	  }
  
	  const tokenDetails = await new Promise((resolve, reject) => {
		jwt.verify(refreshToken, privateKey, (err, decoded) => {
		  if (err) {
			reject(err);
		  } else {
			resolve(decoded);
		  }
		});
	  });
  
  
	  return {
		tokenDetails:tokenDetails,
		error: false,
		message: "Valid refresh token",
	  };
	} catch (err) {
	  throw { error: true, message: err.message };
	}
  };




export default verifyRefreshToken;