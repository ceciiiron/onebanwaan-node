import { create, findAllByBarangay, findOne, updateDetails } from "../controllers/barangayGalleryController.js";
import express from "express";
const router = express.Router();

import multer, { memoryStorage } from "multer";

const upload = multer({
	storage: memoryStorage(),
});

export default (app) => {
	router.post("/:barangay_id/gallery", upload.array("image_files", 10), create);
	router.put("/:barangay_id/gallery/:barangay_gallery_id/details", updateDetails);
	router.get("/:barangay_id/gallery/:barangay_gallery_id", findOne);
	router.get("/:barangay_id/gallery", findAllByBarangay);
	// router.delete("/:barangay_id/gallery/:barangay_ordinance_id", destroy);

	app.use("/api/barangays", router);
};
