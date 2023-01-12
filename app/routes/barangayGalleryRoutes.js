import { create, findAllByBarangay, findOne, updateDetails, destroy, destroyGallery, createImage } from "../controllers/barangayGalleryController.js";
import express from "express";
const router = express.Router();

import multer, { memoryStorage } from "multer";

const upload = multer({
	storage: memoryStorage(),
});

export default (app) => {
	router.post("/:barangay_id/gallery", upload.array("image_files", 10), create);
	router.post("/:barangay_id/gallery/:barangay_gallery_id", upload.array("image_files", 10), createImage);
	router.put("/:barangay_id/gallery/:barangay_gallery_id/details", updateDetails);
	router.get("/:barangay_id/gallery/:barangay_gallery_id", findOne);
	router.delete("/:barangay_id/gallery/:barangay_gallery_id/:barangay_gallery_image_id", destroy);
	router.get("/:barangay_id/gallery", findAllByBarangay);
	router.delete("/:barangay_id/gallery/:barangay_gallery_id", destroyGallery);

	app.use("/api/barangays", router);
};
