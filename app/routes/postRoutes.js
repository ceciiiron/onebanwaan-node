import { create, findAllPaginated, findOne, destroy, heart, destoryHeart } from "../controllers/postController.js";

import { findAllCommentsByPost, findOneComment, createComment, updateComment, destroyComment } from "../controllers/postCommentController.js";

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
	router.get("/types", async (req, res) => {
		//types for dropdown
		const postTypes = await PostType.findAll();

		res.status(200).send(postTypes);
	});
	// isResident
	router.post("/", upload.array("image_files", 4), create);
	router.get("/paginated", findAllPaginated);

	/* ============================== HEART ROUTES ============================== */
	router.post("/:post_id/heart", isResident, heart);
	router.delete("/:post_id/heart", isResident, destoryHeart);
	/* ========================================================================== */

	/* ============================== COMMENT ROUTES ============================== */
	router.post("/:post_id/comments", isResident, createComment);
	router.put("/:post_id/comments/:post_comment_id", updateComment); //isResident
	router.delete("/:post_id/comments/:post_comment_id", destroyComment); //isResident
	router.get("/:post_id/comments/:post_comment_id", findOneComment);
	router.get("/:post_id/comments", findAllCommentsByPost);
	/* ========================================================================== */

	router.get("/:post_id", findOne);
	router.delete("/:post_id", destroy);
	app.use("/api/posts", router);
};
