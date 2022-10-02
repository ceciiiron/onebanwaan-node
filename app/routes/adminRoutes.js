import { verifyToken } from "../middleware/authJWT.js";
import { isAdmin } from "../middleware/authAdminSession.js";
import { create, findAll, findOne, update, destroy } from "../controllers/adminController.js";
// const router = require("express").Router();

import express from "express";
const router = express.Router();

export default (app) => {
	router.post("/", [isAdmin], create);
	router.get("/", [isAdmin], findAll);

	router.get("/:id", [isAdmin], findOne);
	router.put("/:id", [isAdmin], update);
	router.delete("/:id", [isAdmin], destroy);

	app.use("/api/admins", router);
};
