import { create, findAll, findOne, update, destroy } from "../controllers/residentController.js";
// import { create as createP } from "../controllers/postController.js";
import express from "express";
const router = express.Router();

import multer, { memoryStorage } from "multer";

const upload = multer({
	storage: memoryStorage(),
});

export default (app) => {
	// router.post("/post", upload.single("profile_image_link"), createP);
	router.post("/", upload.single("profile_image_link"), create);

	router.get("/", findAll);

	router.get("/:id", findOne);
	router.put(
		"/:id",
		upload.fields([
			{ name: "profile_image_link", maxCount: 1 },
			{ name: "cover_image_link", maxCount: 1 },
		]),
		update
	);
	router.delete("/:id", destroy);

	app.use("/api/residents", router);
};
