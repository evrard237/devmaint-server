import jwt from "jsonwebtoken";
import UserToken from "../db/models/userToken.js";

const generateTokens = async (user) => {
	try {
		const payload = { id: user._id, role: user.role };
		const accessToken = jwt.sign(
			payload,
			process.env.SECRET_STR,
			{ expiresIn: 60 * 2 }
		);
		const refreshToken = jwt.sign(
			payload,
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: "30d" }
		);

		const userToken = await UserToken.findOne({ userId: user._id });
		if (userToken) await userToken.deleteOne();

		await new UserToken({ userId: user._id, token: refreshToken }).save();
		return Promise.resolve({ accessToken, refreshToken });
	} catch (err) {
		return Promise.reject(err);
	}
};

export default generateTokens;