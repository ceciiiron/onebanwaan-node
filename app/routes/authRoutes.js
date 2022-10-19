import { login, logout, getSession, getAccountFromSession } from "../controllers/auth/adminAuthController.js";
import { check, validationResult } from "express-validator";

import { isAdmin } from "../middleware/authAdminSession.js";

export default (app) => {
	app.post(
		"/api/auth/admin/login",
		[
			check("email").notEmpty().withMessage("Email is required").bail().isEmail().withMessage("Invalid Email"),
			check("password").notEmpty().withMessage("Password is required"),
		],
		(req, res, next) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}
			next();
		},
		login
	);
	app.post("/api/auth/admin/logout", logout);
	app.get("/api/auth/admin/getsession", isAdmin, getSession);
	app.get("/api/auth/admin/getaccount", isAdmin, getAccountFromSession);
};
