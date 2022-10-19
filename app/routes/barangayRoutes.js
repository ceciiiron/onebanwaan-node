import { create, findAll, findAllPaginated, findOne, update, destroy } from "../controllers/barangayController.js";
import express from "express";
const router = express.Router();

import multer, { memoryStorage } from "multer";

// const whitelist = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const upload = multer({
	storage: memoryStorage(),
});

export default (app) => {
	router.get("/paginated", findAllPaginated);
	router.post("/", upload.single("image_file"), create);
	router.get("/", findAll);
	router.get("/:id", findOne);
	router.put("/:id", upload.single("image_file"), update);
	router.delete("/:id", destroy);

	app.use("/api/barangays", router);
};
