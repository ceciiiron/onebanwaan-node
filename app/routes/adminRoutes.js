import { verifyToken } from "../middleware/authJWT.js";
import { create, findAll, findOne, update, destroy } from "../controllers/adminController.js";
// const router = require("express").Router();

import express from "express";
const router = express.Router();

export default (app) => {
	router.post("/", [verifyToken], create);
	router.get("/", [verifyToken], findAll);

	router.get("/:id", [verifyToken], findOne);
	router.put("/:id", [verifyToken], update);
	router.delete("/:id", [verifyToken], destroy);

	app.use("/api/admins", router);
};
