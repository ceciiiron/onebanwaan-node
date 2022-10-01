import { login, logout, checkSession } from "../controllers/auth/adminAuthController.js";
import { check, validationResult } from "express-validator";

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
	app.get("/api/auth/admin/checksession", checkSession);
};
