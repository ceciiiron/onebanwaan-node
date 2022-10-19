// import jwt from "jsonwebtoken";
// import { secretKey } from "../config/auth.js";
// const config = require("../config/auth.js");

export const isAdmin = (req, res, next) => {
	console.log("CURRENT ADMIN:", req.session.user);

	// let token = req.headers["x-access-token"];
	// if (!token) {
	// 	return res.status(401).send({ message: "Token not provided" });
	// }

	// jwt.verify(token, secretKey, (err, decoded) => {
	// 	if (err) {
	// 		if (err instanceof jwt.TokenExpiredError) {
	// 			console.log("token is expired.");
	// 			//refresh or do something here
	// 		}
	// 		return res.status(403).send({ message: "unauthorized" });
	// 	}

	// 	req.admin = decoded;
	// 	console.log("decoded: " + decoded);

	// 	next();
	// });

	if (req.session?.user?.admin_id) {
		return next();
	}

	// return res.status(401).send({ message: req.session });
	return res.status(401).send({ message: "Unauthorized" });
};
