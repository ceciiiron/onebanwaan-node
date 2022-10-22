import { create, findAllPaginated } from "../controllers/postController.js";
import { isResident } from "../middleware/authResidentSession.js";
import express from "express";
import db from "../models/index.js";

const PostType = db.sequelize.models.PostType;

const router = express.Router();

import multer, { memoryStorage } from "multer";

const upload = multer({
	storage: memoryStorage(),
});

export default (app) => {
	router.post("/", isResident, upload.single("profile_image_link"), create);
	router.get("/paginated", findAllPaginated);

	//GET POST TYPES FOR DROP DOWN
	router.get("/types", async (req, res) => {
		const postTypes = await PostType.findAll();

		res.status(200).send(postTypes);
	});

	app.use("/api/posts", router);
};
