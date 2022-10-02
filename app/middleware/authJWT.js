import jwt from "jsonwebtoken";
// import { secretKey } from "../config/auth.js";
// const config = require("../config/auth.js");

export const verifyToken = (req, res, next) => {
	let token = req.headers["x-access-token"];
	if (!token) {
		return res.status(401).send({ message: "Token not provided" });
	}

	jwt.verify(token, secretKey, (err, decoded) => {
		if (err) {
			if (err instanceof jwt.TokenExpiredError) {
				console.log("token is expired.");
				//refresh or do something here
			}
			return res.status(403).send({ message: "unauthorized" });
		}

		req.admin = decoded;
		console.log("decoded: " + decoded);

		next();
	});
};
