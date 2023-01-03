import { create, findAllByBarangay, findOne, update } from "../controllers/barangayOrdinanceController.js";
import express from "express";
const router = express.Router();

import multer, { memoryStorage } from "multer";

const upload = multer({
	storage: memoryStorage(),
});

export default (app) => {
	router.post("/:barangay_id/ordinances", upload.single("image_file"), create);
	router.put("/:barangay_id/ordinances/:barangay_ordinance_id", upload.single("image_file"), update);
	router.get("/:barangay_id/ordinances", findAllByBarangay);
	router.get("/:barangay_id/ordinances/:barangay_ordinance_id", findOne);

	app.use("/api/barangays", router);
};
