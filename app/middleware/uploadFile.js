import { promisify } from "util";
import multer, { diskStorage } from "multer";
import { extname } from "path";

const maxSize = 2 * 1024 * 1024;

import slugify from "slugify";

const whitelist = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const storage = diskStorage({
	destination: (req, file, cb) => {
		//http://127.0.0.1:8887/ static/assets/uploads/
		cb(null, "http://127.0.0.1:8887/resources/static/assets/uploads");
		// cb(null, __base_dir + "/resources/static/assets/uploads");
	},
	filename: (req, file, cb) => {
		const dateObj = new Date();

		file.renamedFile = `${dateObj.getFullYear()}${
			dateObj.getMonth() + 1
		}${dateObj.getDate()}${dateObj.getHours()}${dateObj.getMinutes()}${dateObj.getSeconds()}-${Math.floor(Math.random() * 10000)}${extname(
			file.originalname
		)}`;

		cb(null, file.renamedFile);
	},
});

const uploadFile = multer({
	storage,
	fileFilter: (req, file, cb) => {
		if (!whitelist.includes(file.mimetype)) {
			return cb(new Error("File not allowed"));
		}

		cb(null, true);
	},
	limits: { fileSize: maxSize },
}).single("file");

let uploadFileMiddleware = promisify(uploadFile);

export default uploadFileMiddleware;
