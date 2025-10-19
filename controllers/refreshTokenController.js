import jwt from "jsonwebtoken";
import UserToken from "../db/models/userToken.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customErrors.js";

const verifyRefreshToken = async (refreshToken) => {
    const privateKey = process.env.REFRESH_TOKEN_SECRET;
    try {
        const doc = await UserToken.findOne({ token: refreshToken });
        if (!doc) {
            throw new CustomError("Invalid refresh token (not found in DB)", 401);
        }
        const tokenDetails = await jwt.verify(refreshToken, privateKey);
        return { tokenDetails };
    } catch (err) {
        throw new CustomError("Invalid or expired refresh token", 401);
    }
};

export const handleRefreshToken = asyncErrorHandler(async (req, res, next) => {
    const refreshToken = req.cookies.jwt;
    if (!refreshToken) {
        return next(new CustomError("No refresh token found in cookie.", 401));
    }

    const { tokenDetails } = await verifyRefreshToken(refreshToken);

    const payload = { id: tokenDetails.id, role: tokenDetails.role };
    const newAccessToken = jwt.sign(payload, process.env.SECRET_STR, { expiresIn: '15m' });

    res.status(200).json({
        error: false,
        accessToken: newAccessToken,
        message: "Access token created successfully",
    });
});