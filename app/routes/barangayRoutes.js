import { create, findAll, findOne, update, destroy } from "../controllers/barangayController.js";
import express from "express";
const router = express.Router();

import { fileTypeFromFile } from "file-type";
import multer, { diskStorage } from "multer";
import path from "path";

const whitelist = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const upload = multer({
	storage: diskStorage({
		destination: (req, file, cb) => {
			cb(null, __base_dir + "/resources/static/assets/uploads");
			// cb(null, "http://127.0.0.1:8887/resources/static/assets/uploads");
		},
		filename: (req, file, cb) => {
			const dateObj = new Date();

			file.renamedFile = `${dateObj.getFullYear()}${
				dateObj.getMonth() + 1
			}${dateObj.getDate()}${dateObj.getHours()}${dateObj.getMinutes()}${dateObj.getSeconds()}-${Math.floor(Math.random() * 10000)}${path.extname(
				file.originalname
			)}`;

			cb(null, file.renamedFile);
		},
	}),
	fileFilter: (req, file, cb) => {
		//change if put request
		if (req.method == "POST") {
			if (file.fieldname != "image_file") {
				console.log(file.fieldname);
				return cb(new Error("Logo required"));
			}
		}

		// if (file.fieldname != "image_field") {
		// 	cb(null, false);
		// }

		//Make required if post

		if (!file) {
			cb(null, false);
		}

		if (!whitelist.includes(file.mimetype)) {
			return cb(new Error("File extension not allowed"));
		}

		cb(null, true);
	},
});

export default (app) => {
	router.post("/", upload.single("image_file"), create);

	router.get("/", findAll);

	router.get("/:id", findOne);
	router.put("/:id", upload.single("image_file"), update);
	router.delete("/:id", destroy);

	app.use("/api/barangays", router);
};
