import { isAdmin } from "../middleware/authAdminSession.js";
import {
	create,
	findAll,
	findAllPaginated,
	findOne,
	update,
	destroy,
	changePassword,
	currentChangePassword,
	currentUpdate,
} from "../controllers/adminController.js";
// const router = require("express").Router();

import express from "express";
const router = express.Router();

import multer, { memoryStorage } from "multer";

// const whitelist = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const upload = multer({
	storage: memoryStorage(),
});

export default (app) => {
	//testing
	// [isAdmin]
	router.post("/", [isAdmin], upload.single("image_file"), create);
	router.get("/paginated", isAdmin, findAllPaginated);
	router.get("/", isAdmin, findAll);
	router.put("/current/changepassword", [isAdmin], currentChangePassword);
	router.put("/current/updateaccount", isAdmin, upload.single("image_file"), currentUpdate);

	router.put("/:admin_id/changepassword", [isAdmin], changePassword);
	router.get("/:id", isAdmin, findOne);
	router.put("/:id", isAdmin, upload.single("image_file"), update);
	router.delete("/:id", isAdmin, destroy);

	app.use("/api/admins", router);
};
